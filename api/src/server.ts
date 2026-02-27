import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import session from "@fastify/session";
import { mediaRoutes } from "./routes/media.js";
import { authRoutes } from "./routes/auth.js";
import { listRoutes } from "./routes/list.js";
import { registerRequestLogging } from "./middleware/logging.js";
import { registerErrorHandler } from "./middleware/error-handler.js";
import { getSequelize } from "./models/index.js";

export type AppConfig = {
  port: number;
  sessionSecret: string;
};

export function loadConfig(): AppConfig {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  return {
    port: Number(process.env.PORT ?? 3001),
    sessionSecret,
  };
}

function parseBoolean(value?: string): boolean {
  if (!value) {
    return false;
  }
  return value === "true" || value === "1" || value === "yes";
}

export async function createServer() {
  const config = loadConfig();
  const app = Fastify({
    logger: true,
    trustProxy: parseBoolean(process.env.TRUST_PROXY),
  });

  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const corsOrigins = corsOrigin.split(",").map((origin) => origin.trim());

  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 200,
    timeWindow: "1 minute",
  });

  // Register cookie and session plugins
  await app.register(cookie);
  await app.register(session, {
    secret: config.sessionSecret,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });

  if (process.env.DATABASE_URL) {
    getSequelize();
  } else {
    app.log.warn("DATABASE_URL not set; Sequelize models not initialized");
  }

  registerRequestLogging(app);
  registerErrorHandler(app);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(mediaRoutes, { prefix: "/media" });
  await app.register(listRoutes, { prefix: "/list" });

  return app;
}

async function main() {
  const config = loadConfig();
  const app = await createServer();

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  void main();
}
