import { Router } from "express";
import { cardActivity } from "../controllers/activity.controller.js";
import {
  archiveCard,
  createCard,
  getCard,
  moveCard,
  restoreCard,
  updateCard,
} from "../controllers/card.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loadCard, loadList, requireActiveBoard, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  cardParamSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from "../validators/card.schema.js";

const router = Router();

router.post(
  "/lists/:listId/cards",
  requireAuth,
  validate(createCardSchema),
  loadList,
  requireRole("member"),
  requireActiveBoard,
  createCard,
);
router.get("/cards/:cardId", requireAuth, validate(cardParamSchema), loadCard, getCard);
router.patch(
  "/cards/:cardId",
  requireAuth,
  validate(updateCardSchema),
  loadCard,
  requireRole("member"),
  requireActiveBoard,
  updateCard,
);
router.post(
  "/cards/:cardId/move",
  requireAuth,
  validate(moveCardSchema),
  loadCard,
  requireRole("member"),
  requireActiveBoard,
  moveCard,
);
router.post(
  "/cards/:cardId/archive",
  requireAuth,
  validate(cardParamSchema),
  loadCard,
  requireRole("member"),
  requireActiveBoard,
  archiveCard,
);
router.post(
  "/cards/:cardId/restore",
  requireAuth,
  validate(cardParamSchema),
  loadCard,
  requireRole("member"),
  requireActiveBoard,
  restoreCard,
);
router.get("/cards/:cardId/activity", requireAuth, validate(cardParamSchema), loadCard, cardActivity);

export default router;
