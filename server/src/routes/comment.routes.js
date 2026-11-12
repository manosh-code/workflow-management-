import { Router } from "express";
import { addComment, listComments } from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loadCard, requireActiveBoard, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import { cardParamSchema, commentSchema } from "../validators/card.schema.js";

const router = Router();

router.get("/cards/:cardId/comments", requireAuth, validate(cardParamSchema), loadCard, listComments);
router.post(
  "/cards/:cardId/comments",
  requireAuth,
  validate(commentSchema),
  loadCard,
  requireRole("member"),
  requireActiveBoard,
  addComment,
);

export default router;
