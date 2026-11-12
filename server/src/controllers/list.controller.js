import { Card } from "../models/Card.js";
import { List } from "../models/List.js";
import { recordActivity } from "../services/activity.service.js";
import { applyOrder, nextPosition } from "../services/ordering.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createList = asyncHandler(async (req, res) => {
  const list = await List.create({
    boardId: req.board._id,
    name: req.validated.body.name,
    position: await nextPosition(List, { boardId: req.board._id }),
  });
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "list.created",
    metadata: { name: list.name },
  });
  res.status(201).json({ list });
});

export const updateList = asyncHandler(async (req, res) => {
  req.list.name = req.validated.body.name;
  await req.list.save();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "list.renamed",
    metadata: { name: req.list.name, listId: String(req.list._id) },
  });
  res.json({ list: req.list });
});

export const reorderLists = asyncHandler(async (req, res) => {
  const { listIds } = req.validated.body;
  const lists = await List.find({ boardId: req.board._id });
  const existing = new Set(lists.map((list) => String(list._id)));
  if (listIds.length !== lists.length || listIds.some((id) => !existing.has(id))) {
    throw new ApiError(400, "List order must include every list on this board");
  }
  await applyOrder(List, listIds);
  const ordered = await List.find({ boardId: req.board._id }).sort({ position: 1, _id: 1 });
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "list.reordered",
    metadata: { listIds },
  });
  res.json({ lists: ordered });
});

export const deleteList = asyncHandler(async (req, res) => {
  const activeCount = await Card.countDocuments({ listId: req.list._id, archivedAt: null });
  if (activeCount > 0) {
    throw new ApiError(409, "Move or archive the cards in this list before deleting it");
  }
  await Card.deleteMany({ listId: req.list._id });
  await req.list.deleteOne();
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    actorId: req.user._id,
    action: "list.deleted",
    metadata: { name: req.list.name },
  });
  res.json({ message: "List deleted" });
});
