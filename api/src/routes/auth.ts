import type { FastifyInstance } from "fastify";
import { requireAuth } from "../middleware/auth.js";
import { getUserById, loginUser, registerUser } from "../services/auth-service.js";
import { parseLoginBody, parseRegisterBody } from "../validation/auth.js";
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
  app: FastifyInstance
) {
  // Register
  app.post<{ Body: RegisterBody }>(
    "/register",
    { config: { rateLimit: AUTH_RATE_LIMIT } },
    async (request, reply) => {
      const { email, password } = parseRegisterBody(request.body);

      const normalizedEmail = normalizeEmail(email);

      const registerResult = await registerUser({
        email: normalizedEmail,
        password,
      });

      if (registerResult.alreadyExists) {
        reply.code(409);
        return { error: "Email already registered" };
      }

      if (registerResult.user === null) {
        reply.code(500);
        return { error: "Failed to create user" };
      }

      const user = registerResult.user;

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
      const { email, password } = parseLoginBody(request.body);

      const normalizedEmail = normalizeEmail(email);

      const { user } = await loginUser({
        email: normalizedEmail,
        password,
      });

      if (!user) {
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
  app.post("/logout", async (request) => {
    await request.session.destroy();
    return { success: true };
  });

  // Get current user
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.session.userId!;
    const user = await getUserById(userId);
    if (!user) {
      reply.code(401);
      return { error: "User not found" };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    };
  });
}