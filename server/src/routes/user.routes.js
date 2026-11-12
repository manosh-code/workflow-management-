import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateProfileSchema } from "../validators/auth.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/me", getProfile);
router.patch("/me", validate(updateProfileSchema), updateProfile);

export default router;
