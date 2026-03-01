import "@fastify/session";

declare module "@fastify/session" {
  interface FastifySessionObject {
    userId?: string;
  }

  interface SessionData {
    userId?: string;
  }
}