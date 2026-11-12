import { Board } from "../models/Board.js";
import { Card } from "../models/Card.js";
import { Membership } from "../models/Membership.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const searchCards = asyncHandler(async (req, res) => {
  const { q, boardId, organizationId, assigneeId, labelId, due } = req.validated.query;
  const memberships = await Membership.find({ userId: req.user._id }).select("organizationId");
  let organizationIds = memberships.map((membership) => membership.organizationId);

  if (organizationId) {
    const allowed = organizationIds.some((id) => String(id) === organizationId);
    if (!allowed) throw new ApiError(404, "Resource not found");
    organizationIds = organizationIds.filter((id) => String(id) === organizationId);
  }

  const boardFilter = { organizationId: { $in: organizationIds }, archivedAt: null };
  if (boardId) boardFilter._id = boardId;
  const boards = await Board.find(boardFilter).select("_id name");
  if (boardId && boards.length === 0) {
    throw new ApiError(404, "Resource not found");
  }

  const filter = {
    boardId: { $in: boards.map((board) => board._id) },
    archivedAt: null,
  };
  if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };
  if (assigneeId) filter.assigneeIds = assigneeId;
  if (labelId) filter.labelIds = labelId;

  const now = new Date();
  if (due === "overdue") filter.dueDate = { $ne: null, $lt: now };
  if (due === "upcoming") filter.dueDate = { $gte: now };
  if (due === "none") filter.dueDate = null;

  const cards = await Card.find(filter).sort({ updatedAt: -1 }).limit(50);
  const boardNames = new Map(boards.map((board) => [String(board._id), board.name]));
  res.json({
    cards: cards.map((card) => ({
      ...card.toJSON(),
      boardName: boardNames.get(String(card.boardId)) || "",
    })),
  });
});
