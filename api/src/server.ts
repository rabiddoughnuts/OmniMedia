import "dotenv/config";
import Fastify from "fastify";
import { mediaRoutes } from "./routes/media.js";

export type AppConfig = {
  port: number;
};

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
  };
}

export function createServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => {
    return { status: "ok" };
  });

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
