import { z } from "zod";

export const mediaCreateSchema = z.object({
  external_id: z.string().optional(),
  title: z.string().min(1),
  type: z.string().min(1),
  cover_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const mediaUpdateSchema = z.object({
  external_id: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  cover_url: z.string().url().optional().nullable(),
  description: z.string().optional().nullable(),
});
