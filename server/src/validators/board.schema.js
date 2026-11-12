import { z } from "zod";
import { LABEL_COLORS } from "../models/Label.js";
import { objectId } from "./auth.schema.js";

const paramsId = (key) =>
  z.object({ [key]: objectId }).passthrough();

export const createOrganizationSchema = z.object({
  body: z.object({ name: z.string().trim().min(2).max(80) }).strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateOrganizationSchema = z.object({
  body: z.object({ name: z.string().trim().min(2).max(80) }).strict(),
  params: paramsId("orgId"),
  query: z.object({}).passthrough(),
});

export const orgParamSchema = z.object({
  body: z.object({}).passthrough(),
  params: paramsId("orgId"),
  query: z.object({}).passthrough(),
});

export const addMemberSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email().max(160),
      role: z.enum(["admin", "member", "viewer"]),
    })
    .strict(),
  params: paramsId("orgId"),
  query: z.object({}).passthrough(),
});

export const updateMemberSchema = z.object({
  body: z.object({ role: z.enum(["admin", "member", "viewer"]) }).strict(),
  params: z.object({ orgId: objectId, userId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const removeMemberSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ orgId: objectId, userId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const createBoardSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().max(2000).optional(),
    })
    .strict(),
  params: paramsId("orgId"),
  query: z.object({}).passthrough(),
});

export const updateBoardSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(120).optional(),
      description: z.string().trim().max(2000).optional(),
    })
    .strict()
    .refine((value) => value.name !== undefined || value.description !== undefined, {
      message: "Provide a name or description",
    }),
  params: paramsId("boardId"),
  query: z.object({}).passthrough(),
});

export const boardParamSchema = z.object({
  body: z.object({}).passthrough(),
  params: paramsId("boardId"),
  query: z
    .object({
      includeArchived: z.enum(["true", "false"]).optional(),
    })
    .passthrough(),
});

export const createLabelSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(40),
      color: z.enum(LABEL_COLORS),
    })
    .strict(),
  params: paramsId("boardId"),
  query: z.object({}).passthrough(),
});

export const labelParamSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ boardId: objectId, labelId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});
