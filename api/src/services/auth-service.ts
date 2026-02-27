import bcrypt from "bcrypt";
import { getDb } from "../db.js";

const SALT_ROUNDS = 10;

type RegisterInput = {
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type UserRow = {
  id: string;
  email: string;
  created_at: string;
};

type RegisterResult =
  | { user: UserRow; alreadyExists: false }
  | { user: null; alreadyExists: true };

type DbError = Error & { code?: string };

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as DbError).code === "23505";
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const db = getDb();

  const { rows: existing } = await db.query(
    "SELECT id FROM users.users WHERE email = $1",
    [input.email]
  );

  if (existing.length > 0) {
    return { user: null, alreadyExists: true };
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  let rows: UserRow[];
  try {
    ({ rows } = await db.query(
      `INSERT INTO users.users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [input.email, passwordHash]
    ));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { user: null, alreadyExists: true };
    }
    throw error;
  }

  return { user: rows[0], alreadyExists: false };
}

export async function loginUser(input: LoginInput) {
  const db = getDb();

  const { rows } = await db.query(
    "SELECT id, email, password_hash, created_at FROM users.users WHERE email = $1",
    [input.email]
  );

  if (rows.length === 0) {
    return { user: null };
  }

  const user = rows[0];
  const valid = await bcrypt.compare(input.password, user.password_hash);

  if (!valid) {
    return { user: null };
  }

  return { user };
}

export async function getUserById(userId: string) {
  const db = getDb();

  const { rows } = await db.query(
    "SELECT id, email, created_at FROM users.users WHERE id = $1",
    [userId]
  );

  return rows[0] ?? null;
}
