import { z } from "zod";
import { objectId } from "./auth.schema.js";

const dueDate = z.union([
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
  z.null(),
]);

export const createCardSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(5000).optional(),
    })
    .strict(),
  params: z.object({ listId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateCardSchema = z.object({
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(5000).optional(),
      dueDate: dueDate.optional(),
      assigneeIds: z.array(objectId).max(50).optional(),
      labelIds: z.array(objectId).max(30).optional(),
    })
    .strict(),
  params: z.object({ cardId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const moveCardSchema = z.object({
  body: z
    .object({
      listId: objectId,
      index: z.number().int().min(0).max(5000),
    })
    .strict(),
  params: z.object({ cardId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const cardParamSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ cardId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const commentSchema = z.object({
  body: z.object({ body: z.string().trim().min(1).max(2000) }).strict(),
  params: z.object({ cardId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const searchSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z
    .object({
      q: z.string().trim().max(200).optional(),
      boardId: objectId.optional(),
      organizationId: objectId.optional(),
      assigneeId: objectId.optional(),
      labelId: objectId.optional(),
      due: z.enum(["overdue", "upcoming", "none"]).optional(),
    })
    .passthrough(),
});
