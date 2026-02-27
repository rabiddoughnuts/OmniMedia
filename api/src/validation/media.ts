import { mediaCreateSchema, mediaUpdateSchema } from "@omnimediatrak/shared";
import { parseBody } from "./validate.js";

export function parseMediaCreateBody(body: unknown) {
  return parseBody(mediaCreateSchema, body);
}

export function parseMediaUpdateBody(body: unknown) {
  return parseBody(mediaUpdateSchema, body);
}
