import type { FastifyRequest, FastifyReply } from "fastify";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!request.session.userId) {
    reply.code(401);
    return reply.send({ error: "Authentication required" });
  }
}