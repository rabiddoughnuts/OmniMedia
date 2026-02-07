import "dotenv/config";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import session from "@fastify/session";
import { mediaRoutes } from "./routes/media.js";
import { authRoutes } from "./routes/auth.js";

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

export function createServer() {
  const config = loadConfig();
  const app = Fastify({ logger: true });

  // Register cookie and session plugins
  app.register(cookie);
  app.register(session, {
    secret: config.sessionSecret,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.register(authRoutes, { prefix: "/auth" });
  app.register(mediaRoutes, { prefix: "/media" });

  return app;
}

async function main() {
  const config = loadConfig();
  const app = createServer();

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
