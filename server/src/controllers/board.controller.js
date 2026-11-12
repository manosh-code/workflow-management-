import { Board } from "../models/Board.js";
import { Card } from "../models/Card.js";
import { Label } from "../models/Label.js";
import { List } from "../models/List.js";
import { Membership } from "../models/Membership.js";
import { recordActivity } from "../services/activity.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DEFAULT_LISTS = ["To Do", "In Progress", "Done"];

function memberView(membership) {
  const user = membership.userId;
  return {
    userId: user?._id || membership.userId,
    name: user?.name || "Unknown",
    email: user?.email || "",
    role: membership.role,
  };
}

export const createBoard = asyncHandler(async (req, res) => {
  const board = await Board.create({
    organizationId: req.organization._id,
    name: req.validated.body.name,
    description: req.validated.body.description || "",
    createdBy: req.user._id,
  });

  try {
    await List.insertMany(
      DEFAULT_LISTS.map((name, index) => ({
        boardId: board._id,
        name,
        position: (index + 1) * 1024,
      })),
    );
  } catch (error) {
    await List.deleteMany({ boardId: board._id });
    await Board.deleteOne({ _id: board._id });
    throw error;
  }

  await recordActivity({
    organizationId: board.organizationId,
    boardId: board._id,
    actorId: req.user._id,
    action: "board.created",
    metadata: { name: board.name },
  });

  res.status(201).json({ board });
});

export const listBoards = asyncHandler(async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const filter = { organizationId: req.organization._id };
  if (!includeArchived) filter.archivedAt = null;
  const boards = await Board.find(filter).sort({ updatedAt: -1 });
  res.json({ boards });
});

export const getBoard = asyncHandler(async (req, res) => {
  const includeArchived = req.query.includeArchived === "true";
  const cardFilter = { boardId: req.board._id };
  if (!includeArchived) cardFilter.archivedAt = null;

  const [lists, cards, labels, memberships] = await Promise.all([
    List.find({ boardId: req.board._id }).sort({ position: 1, _id: 1 }),
    Card.find(cardFilter).sort({ position: 1, _id: 1 }),
    Label.find({ boardId: req.board._id }).sort({ name: 1 }),
    Membership.find({ organizationId: req.board.organizationId }).populate("userId", "name email"),
  ]);

  res.json({
    board: req.board,
    lists,
    cards,
    labels,
    members: memberships.map(memberView),
    role: req.membership.role,
  });
});

export const updateBoard = asyncHandler(async (req, res) => {
  const { name, description } = req.validated.body;
  if (name !== undefined) req.board.name = name;
  if (description !== undefined) req.board.description = description;
  await req.board.save();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "board.updated",
    metadata: { name: req.board.name },
  });
  res.json({ board: req.board });
});

export const archiveBoard = asyncHandler(async (req, res) => {
  req.board.archivedAt = new Date();
  await req.board.save();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "board.archived",
    metadata: { name: req.board.name },
  });
  res.json({ board: req.board });
});

export const restoreBoard = asyncHandler(async (req, res) => {
  req.board.archivedAt = null;
  await req.board.save();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "board.restored",
    metadata: { name: req.board.name },
  });
  res.json({ board: req.board });
});

export const createLabel = asyncHandler(async (req, res) => {
  const label = await Label.create({
    boardId: req.board._id,
    name: req.validated.body.name,
    color: req.validated.body.color,
  });
  res.status(201).json({ label });
});

export const deleteLabel = asyncHandler(async (req, res) => {
  const label = await Label.findOne({ _id: req.params.labelId, boardId: req.board._id });
  if (!label) throw new ApiError(404, "Resource not found");
  await Card.updateMany({ boardId: req.board._id }, { $pull: { labelIds: label._id } });
  await label.deleteOne();
  res.json({ message: "Label removed" });
});
