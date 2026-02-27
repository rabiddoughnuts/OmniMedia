import { mediaQuerySchema } from "@omnimediatrak/shared";
import { parseQuery } from "./validate.js";

export function parseMediaQuery(query: unknown) {
  return parseQuery(mediaQuerySchema, query);
}
