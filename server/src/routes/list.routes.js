import { Router } from "express";
import { createList, deleteList, reorderLists, updateList } from "../controllers/list.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loadBoard, loadList, requireActiveBoard, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  createListSchema,
  listParamSchema,
  reorderListsSchema,
  updateListSchema,
} from "../validators/list.schema.js";

const router = Router();

router.post(
  "/boards/:boardId/lists",
  requireAuth,
  validate(createListSchema),
  loadBoard,
  requireRole("member"),
  requireActiveBoard,
  createList,
);
router.post(
  "/boards/:boardId/lists/reorder",
  requireAuth,
  validate(reorderListsSchema),
  loadBoard,
  requireRole("member"),
  requireActiveBoard,
  reorderLists,
);
router.patch(
  "/lists/:listId",
  requireAuth,
  validate(updateListSchema),
  loadList,
  requireRole("member"),
  requireActiveBoard,
  updateList,
);
router.delete(
  "/lists/:listId",
  requireAuth,
  validate(listParamSchema),
  loadList,
  requireRole("member"),
  requireActiveBoard,
  deleteList,
);

export default router;
