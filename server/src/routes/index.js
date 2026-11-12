import { Router } from "express";
import authRoutes from "./auth.routes.js";
import boardRoutes from "./board.routes.js";
import cardRoutes from "./card.routes.js";
import commentRoutes from "./comment.routes.js";
import listRoutes from "./list.routes.js";
import organizationRoutes from "./organization.routes.js";
import searchRoutes from "./search.routes.js";
import userRoutes from "./user.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/organizations", organizationRoutes);
router.use("/boards", boardRoutes);
router.use(listRoutes);
router.use(cardRoutes);
router.use(commentRoutes);
router.use("/search", searchRoutes);

export default router;
