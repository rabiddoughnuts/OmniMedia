import { z } from "zod";

export const mediaQuerySchema = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
  type: z.string().optional(),
  q: z.string().optional(),
});
