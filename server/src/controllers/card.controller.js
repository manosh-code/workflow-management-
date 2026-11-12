import { Card } from "../models/Card.js";
import { Label } from "../models/Label.js";
import { List } from "../models/List.js";
import { Membership } from "../models/Membership.js";
import { recordActivity } from "../services/activity.service.js";
import { nextPosition, positionForIndex } from "../services/ordering.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function assertAssignees(board, assigneeIds) {
  if (!assigneeIds) return;
  const unique = [...new Set(assigneeIds)];
  const count = await Membership.countDocuments({
    organizationId: board.organizationId,
    userId: { $in: unique },
  });
  if (count !== unique.length) {
    throw new ApiError(400, "Assignees must belong to this organization");
  }
}

async function assertLabels(boardId, labelIds) {
  if (!labelIds) return;
  const unique = [...new Set(labelIds)];
  const count = await Label.countDocuments({ boardId, _id: { $in: unique } });
  if (count !== unique.length) {
    throw new ApiError(400, "Labels must belong to this board");
  }
}

export const createCard = asyncHandler(async (req, res) => {
  const card = await Card.create({
    boardId: req.board._id,
    listId: req.list._id,
    title: req.validated.body.title,
    description: req.validated.body.description || "",
    position: await nextPosition(Card, { listId: req.list._id, archivedAt: null }),
    createdBy: req.user._id,
  });
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    cardId: card._id,
    actorId: req.user._id,
    action: "card.created",
    metadata: { title: card.title, listId: String(req.list._id) },
  });
  res.status(201).json({ card });
});

export const getCard = asyncHandler(async (req, res) => {
  res.json({ card: req.card });
});

export const updateCard = asyncHandler(async (req, res) => {
  const { title, description, dueDate, assigneeIds, labelIds } = req.validated.body;
  await assertAssignees(req.board, assigneeIds);
  await assertLabels(req.board._id, labelIds);

  if (title !== undefined) req.card.title = title;
  if (description !== undefined) req.card.description = description;
  if (dueDate !== undefined) req.card.dueDate = dueDate ? new Date(dueDate) : null;
  if (assigneeIds !== undefined) req.card.assigneeIds = assigneeIds;
  if (labelIds !== undefined) req.card.labelIds = labelIds;
  await req.card.save();

  const action = assigneeIds !== undefined ? "card.assigned" : "card.updated";
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    cardId: req.card._id,
    actorId: req.user._id,
    action,
    metadata: { title: req.card.title },
  });
  res.json({ card: req.card });
});

export const moveCard = asyncHandler(async (req, res) => {
  const { listId, index } = req.validated.body;
  const destination = await List.findById(listId);
  if (!destination || String(destination.boardId) !== String(req.card.boardId)) {
    throw new ApiError(400, "Destination list must belong to the same board");
  }

  const previousListId = String(req.card.listId);
  const position = await positionForIndex(
    Card,
    { listId: destination._id, archivedAt: null, _id: { $ne: req.card._id } },
    index,
  );
  req.card.listId = destination._id;
  req.card.position = position;
  await req.card.save();

  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    cardId: req.card._id,
    actorId: req.user._id,
    action: "card.moved",
    metadata: { fromListId: previousListId, toListId: String(destination._id), title: req.card.title },
  });
  res.json({ card: req.card });
});

export const archiveCard = asyncHandler(async (req, res) => {
  req.card.archivedAt = req.card.archivedAt || new Date();
  await req.card.save();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    cardId: req.card._id,
    actorId: req.user._id,
    action: "card.archived",
    metadata: { title: req.card.title },
  });
  res.json({ card: req.card });
});

export const restoreCard = asyncHandler(async (req, res) => {
  const list = await List.findById(req.card.listId);
  if (!list || String(list.boardId) !== String(req.card.boardId)) {
    throw new ApiError(409, "Card list is no longer on this board");
  }
  req.card.archivedAt = null;
  req.card.position = await nextPosition(Card, { listId: req.card.listId, archivedAt: null });
  await req.card.save();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    cardId: req.card._id,
    actorId: req.user._id,
    action: "card.restored",
    metadata: { title: req.card.title },
  });
  res.json({ card: req.card });
});
