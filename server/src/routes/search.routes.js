import { Router } from "express";
import { searchCards } from "../controllers/search.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { searchSchema } from "../validators/card.schema.js";

const router = Router();

router.get("/", requireAuth, validate(searchSchema), searchCards);

export default router;
