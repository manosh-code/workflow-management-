import { Membership } from "../models/Membership.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { recordActivity } from "../services/activity.service.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function memberView(membership) {
  const user = membership.userId;
  return {
    _id: membership._id,
    userId: user?._id || membership.userId,
    name: user?.name || "Unknown",
    email: user?.email || "",
    role: membership.role,
    joinedAt: membership.joinedAt,
  };
}

async function assertAdminRemains(organizationId, userId) {
  const remaining = await Membership.countDocuments({
    organizationId,
    role: "admin",
    userId: { $ne: userId },
  });
  if (remaining < 1) {
    throw new ApiError(409, "Organization must keep at least one administrator");
  }
}

export const createOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.create({
    name: req.validated.body.name,
    ownerId: req.user._id,
  });

  try {
    await Membership.create({
      organizationId: organization._id,
      userId: req.user._id,
      role: "admin",
    });
  } catch (error) {
    await Organization.deleteOne({ _id: organization._id });
    throw error;
  }

  await recordActivity({
    organizationId: organization._id,
    actorId: req.user._id,
    action: "organization.created",
    metadata: { name: organization.name },
  });

  res.status(201).json({ organization });
});

export const listOrganizations = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ userId: req.user._id }).populate("organizationId");
  const organizations = memberships
    .filter((membership) => membership.organizationId)
    .map((membership) => ({
      ...membership.organizationId.toJSON(),
      role: membership.role,
    }));
  res.json({ organizations });
});

export const getOrganization = asyncHandler(async (req, res) => {
  const memberships = await Membership.find({ organizationId: req.organization._id }).populate(
    "userId",
    "name email",
  );
  res.json({
    organization: req.organization,
    role: req.membership.role,
    members: memberships.map(memberView),
  });
});

export const updateOrganization = asyncHandler(async (req, res) => {
  req.organization.name = req.validated.body.name;
  await req.organization.save();
  res.json({ organization: req.organization });
});

export const addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No account exists for that email");
  }

  const existing = await Membership.findOne({
    organizationId: req.organization._id,
    userId: user._id,
  });
  if (existing) {
    throw new ApiError(409, "That user is already a member");
  }

  const membership = await Membership.create({
    organizationId: req.organization._id,
    userId: user._id,
    role,
  });
  await membership.populate("userId", "name email");

  await recordActivity({
    organizationId: req.organization._id,
    actorId: req.user._id,
    action: "member.added",
    metadata: { userId: String(user._id), role },
  });

  res.status(201).json({ member: memberView(membership) });
});

export const updateMember = asyncHandler(async (req, res) => {
  const membership = await Membership.findOne({
    organizationId: req.organization._id,
    userId: req.params.userId,
  }).populate("userId", "name email");
  if (!membership) {
    throw new ApiError(404, "Resource not found");
  }

  if (membership.role === "admin" && req.validated.body.role !== "admin") {
    await assertAdminRemains(req.organization._id, membership.userId._id || membership.userId);
  }

  membership.role = req.validated.body.role;
  await membership.save();

  await recordActivity({
    organizationId: req.organization._id,
    actorId: req.user._id,
    action: "member.role_changed",
    metadata: { userId: String(req.params.userId), role: membership.role },
  });

  res.json({ member: memberView(membership) });
});

export const removeMember = asyncHandler(async (req, res) => {
  const membership = await Membership.findOne({
    organizationId: req.organization._id,
    userId: req.params.userId,
  });
  if (!membership) {
    throw new ApiError(404, "Resource not found");
  }
  if (membership.role === "admin") {
    await assertAdminRemains(req.organization._id, membership.userId);
  }
  await membership.deleteOne();

  await recordActivity({
    organizationId: req.organization._id,
    actorId: req.user._id,
    action: "member.removed",
    metadata: { userId: String(req.params.userId) },
  });

  res.json({ message: "Member removed" });
});
