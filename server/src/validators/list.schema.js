import { z } from "zod";
import { objectId } from "./auth.schema.js";

export const createListSchema = z.object({
  body: z.object({ name: z.string().trim().min(1).max(80) }).strict(),
  params: z.object({ boardId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateListSchema = z.object({
  body: z.object({ name: z.string().trim().min(1).max(80) }).strict(),
  params: z.object({ listId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const listParamSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ listId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});

export const reorderListsSchema = z.object({
  body: z.object({ listIds: z.array(objectId).min(1).max(50) }).strict(),
  params: z.object({ boardId: objectId }).passthrough(),
  query: z.object({}).passthrough(),
});
