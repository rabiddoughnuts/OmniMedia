import { loginSchema, registerSchema } from "@omnimediatrak/shared";
import { parseBody } from "./validate.js";

export type RegisterInput = ReturnType<typeof parseRegisterBody>;
export type LoginInput = ReturnType<typeof parseLoginBody>;

export function parseRegisterBody(body: unknown) {
  return parseBody(registerSchema, body);
}

export function parseLoginBody(body: unknown) {
  return parseBody(loginSchema, body);
}
