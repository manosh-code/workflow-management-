import { Router } from "express";
import { boardActivity } from "../controllers/activity.controller.js";
import {
  archiveBoard,
  createLabel,
  deleteLabel,
  getBoard,
  restoreBoard,
  updateBoard,
} from "../controllers/board.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loadBoard, requireActiveBoard, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  boardParamSchema,
  createLabelSchema,
  labelParamSchema,
  updateBoardSchema,
} from "../validators/board.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/:boardId", validate(boardParamSchema), loadBoard, getBoard);
router.patch(
  "/:boardId",
  validate(updateBoardSchema),
  loadBoard,
  requireRole("member"),
  requireActiveBoard,
  updateBoard,
);
router.post("/:boardId/archive", validate(boardParamSchema), loadBoard, requireRole("member"), archiveBoard);
router.post(
  "/:boardId/restore",
  validate(boardParamSchema),
  loadBoard,
  requireRole("member"),
  restoreBoard,
);
router.get("/:boardId/activity", validate(boardParamSchema), loadBoard, boardActivity);
router.post(
  "/:boardId/labels",
  validate(createLabelSchema),
  loadBoard,
  requireRole("member"),
  requireActiveBoard,
  createLabel,
);
router.delete(
  "/:boardId/labels/:labelId",
  validate(labelParamSchema),
  loadBoard,
  requireRole("member"),
  requireActiveBoard,
  deleteLabel,
);

export default router;
