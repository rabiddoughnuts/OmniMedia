import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  createMedia,
  deleteMedia,
  getMediaByIdOrExternal,
  listMedia,
  updateMedia,
} from "../services/media-service.js";
import { parseMediaCreateBody, parseMediaUpdateBody } from "../validation/media.js";
import { parseMediaQuery } from "../validation/query.js";

type MediaQuery = {
  page?: string;
  pageSize?: string;
  type?: string;
  q?: string;
};

export async function mediaRoutes(
  app: FastifyInstance
) {
  const adminToken = process.env.MEDIA_ADMIN_TOKEN;

  function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const headerValue = request.headers["x-admin-token"];
    const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!adminToken || token !== adminToken) {
      reply.code(403);
      return { error: "Forbidden" };
    }
    return null;
  }

  app.get<{ Querystring: MediaQuery }>("/", async (request) => {
    const query = parseMediaQuery(request.query);
    return listMedia(query);
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const media = await getMediaByIdOrExternal(request.params.id);
    if (!media) {
      reply.code(404);
      return { message: "Not found" };
    }

    return media;
  });

  app.post("/", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const input = parseMediaCreateBody(request.body);
    const created = await createMedia(input);
    reply.code(201);
    return created;
  });

  app.put<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const input = parseMediaUpdateBody(request.body);
    const updated = await updateMedia(request.params.id, input);
    if (!updated) {
      reply.code(404);
      return { error: "Not found" };
    }

    return updated;
  });

  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const input = parseMediaUpdateBody(request.body);
    const updated = await updateMedia(request.params.id, input);
    if (!updated) {
      reply.code(404);
      return { error: "Not found" };
    }

    return updated;
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const deleted = await deleteMedia(request.params.id);
    if (!deleted) {
      reply.code(404);
      return { error: "Not found" };
    }

    return { success: true };
  });
}
