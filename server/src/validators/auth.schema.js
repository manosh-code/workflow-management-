import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(80),
      email: z.string().trim().email().max(160),
      password: z.string().min(8).max(128),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z.string().trim().email().max(160),
      password: z.string().min(1).max(128),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(80),
    })
    .strict(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

export { objectId };
