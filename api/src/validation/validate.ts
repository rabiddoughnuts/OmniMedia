import type { z } from "zod";
import { RequestValidationError } from "./errors.js";

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new RequestValidationError("Invalid request", parsed.error.flatten());
  }
  return parsed.data;
}

export function parseQuery<T>(schema: z.ZodType<T>, query: unknown): T {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    throw new RequestValidationError("Invalid query", parsed.error.flatten());
  }
  return parsed.data;
}

export function ensure(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new RequestValidationError(message);
  }
}

export function ensureDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new RequestValidationError(message);
  }
}
