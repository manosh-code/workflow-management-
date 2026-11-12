import { Router } from "express";
import { createBoard, listBoards } from "../controllers/board.controller.js";
import {
  addMember,
  createOrganization,
  getOrganization,
  listOrganizations,
  removeMember,
  updateMember,
  updateOrganization,
} from "../controllers/organization.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { loadOrg, requireRole } from "../middleware/authorize.js";
import { validate } from "../middleware/validate.js";
import {
  addMemberSchema,
  createBoardSchema,
  createOrganizationSchema,
  orgParamSchema,
  removeMemberSchema,
  updateMemberSchema,
  updateOrganizationSchema,
} from "../validators/board.schema.js";

const router = Router();

router.use(requireAuth);
router.get("/", listOrganizations);
router.post("/", validate(createOrganizationSchema), createOrganization);
router.get("/:orgId", validate(orgParamSchema), loadOrg, getOrganization);
router.patch(
  "/:orgId",
  validate(updateOrganizationSchema),
  loadOrg,
  requireRole("admin"),
  updateOrganization,
);
router.get("/:orgId/members", validate(orgParamSchema), loadOrg, getOrganization);
router.post("/:orgId/members", validate(addMemberSchema), loadOrg, requireRole("admin"), addMember);
router.patch(
  "/:orgId/members/:userId",
  validate(updateMemberSchema),
  loadOrg,
  requireRole("admin"),
  updateMember,
);
router.delete(
  "/:orgId/members/:userId",
  validate(removeMemberSchema),
  loadOrg,
  requireRole("admin"),
  removeMember,
);
router.get("/:orgId/boards", validate(orgParamSchema), loadOrg, listBoards);
router.post("/:orgId/boards", validate(createBoardSchema), loadOrg, requireRole("member"), createBoard);

export default router;
