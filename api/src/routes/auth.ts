import "dotenv/config";
import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import bcrypt from "bcrypt";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const AUTH_RATE_LIMIT = {
  max: 10,
  timeWindow: "1 minute",
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface RegisterBody {
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export async function authRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // Register
  app.post<{ Body: RegisterBody }>(
    "/register",
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      const { email, password } = request.body;

    if (!email || !password) {
      reply.code(400);
      return { error: "Email and password are required" };
    }

    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(normalizedEmail)) {
      reply.code(400);
      return { error: "Invalid email address" };
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      reply.code(400);
      return { error: "Password must be at least 8 characters" };
    }

    const db = getDb();

    // Check if user exists
     const { rows: existing } = await db.query(
       "SELECT id FROM users.users WHERE email = $1",
      [normalizedEmail]
    );

    if (existing.length > 0) {
      reply.code(409);
      return { error: "Email already registered" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const { rows } = await db.query(
       `INSERT INTO users.users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at`,
      [normalizedEmail, passwordHash]
    );

    const user = rows[0];

    // Set session
    request.session.userId = user.id;

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    };
    }
  );

  // Login
  app.post<{ Body: LoginBody }>(
    "/login",
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      const { email, password } = request.body;

    if (!email || !password) {
      reply.code(400);
      return { error: "Email and password are required" };
    }

    const normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(normalizedEmail)) {
      reply.code(400);
      return { error: "Invalid email address" };
    }

    const db = getDb();

    const { rows } = await db.query(
       "SELECT id, email, password_hash, created_at FROM users.users WHERE email = $1",
      [normalizedEmail]
    );

    if (rows.length === 0) {
      reply.code(401);
      return { error: "Invalid email or password" };
    }

    const user = rows[0];

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      reply.code(401);
      return { error: "Invalid email or password" };
    }

    // Set session
    request.session.userId = user.id;

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    };
    }
  );

  // Logout
  app.post("/logout", async (request, reply) => {
    await request.session.destroy();
    return { success: true };
  });

  // Get current user
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const db = getDb();

    const { rows } = await db.query(
       "SELECT id, email, created_at FROM users.users WHERE id = $1",
      [request.session.userId]
    );

    if (rows.length === 0) {
      reply.code(401);
      return { error: "User not found" };
    }

    const user = rows[0];

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    };
  });
}