import { listStatusSchema } from "@omnimediatrak/shared";
import { parseBody } from "./validate.js";

export function parseListStatusBody(body: unknown) {
  return parseBody(listStatusSchema, body);
}
