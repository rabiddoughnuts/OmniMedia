import { z } from "zod";

export const listStatusSchema = z.object({
  mediaId: z.string().uuid(),
  status: z.enum(["planned", "in-progress", "completed", "dropped"]),
  rating: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional().nullable(),
});
