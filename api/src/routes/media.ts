import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import { getDb } from "../db.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function parsePage(value?: string): number {
  const parsed = Number(value ?? 1);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

function parsePageSize(value?: string): number {
  const parsed = Number(value ?? DEFAULT_PAGE_SIZE);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

type MediaQuery = {
  page?: string;
  pageSize?: string;
  type?: string;
  q?: string;
};

export async function mediaRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  const adminToken = process.env.MEDIA_ADMIN_TOKEN;

  function toLtreeLabel(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
  }

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
    const db = getDb();
    const page = parsePage(request.query.page);
    const pageSize = parsePageSize(request.query.pageSize);
    const offset = (page - 1) * pageSize;

    const filters: string[] = [];
    const values: Array<string | number> = [];

    if (request.query.type) {
      values.push(request.query.type);
      filters.push(`media_type = $${values.length}`);
    }

    if (request.query.q) {
      values.push(`%${request.query.q}%`);
      filters.push(`title ILIKE $${values.length}`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM media.media ${whereClause}`,
      values
    );

    values.push(pageSize, offset);
    const itemsResult = await db.query(
      `SELECT id, external_id, title, media_type AS type, cover_url, description
       FROM media.media
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return {
      items: itemsResult.rows,
      page,
      pageSize,
      total: countResult.rows[0]?.total ?? 0,
    };
  });

  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const db = getDb();
    const { rows } = await db.query(
      `SELECT id, external_id, title, media_type AS type, cover_url, description
       FROM media.media
       WHERE id::text = $1 OR external_id = $1
       LIMIT 1`,
      [request.params.id]
    );

    if (rows.length === 0) {
      reply.code(404);
      return { message: "Not found" };
    }

    return rows[0];
  });

  app.post<{
    Body: {
      external_id?: string;
      title: string;
      type: string;
      cover_url?: string | null;
      description?: string | null;
    };
  }>("/", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const { external_id, title, type, cover_url, description } = request.body;
    if (!title || !type) {
      reply.code(400);
      return { error: "title and type are required" };
    }

    const db = getDb();
    const { rows } = await db.query(
      `INSERT INTO media.media (external_id, media_type, media_class, title, cover_url, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, external_id, title, media_type AS type, cover_url, description`,
      [
        external_id ?? null,
        type,
        `media.${toLtreeLabel(type)}`,
        title,
        cover_url ?? null,
        description ?? null,
      ]
    );

    reply.code(201);
    return rows[0];
  });

  app.put<{
    Params: { id: string };
    Body: {
      external_id?: string | null;
      title?: string;
      type?: string;
      cover_url?: string | null;
      description?: string | null;
    };
  }>("/:id", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const { external_id, title, type, cover_url, description } = request.body;
    const db = getDb();

    const { rows } = await db.query(
        `UPDATE media.media
       SET external_id = COALESCE($2, external_id),
           title = COALESCE($3, title),
           media_type = COALESCE($4, media_type),
           media_class = COALESCE($7, media_class),
           cover_url = COALESCE($5, cover_url),
           description = COALESCE($6, description),
           updated_at = NOW()
         WHERE id::text = $1 OR external_id = $1
       RETURNING id, external_id, title, media_type AS type, cover_url, description`,
      [
        request.params.id,
        external_id ?? null,
        title ?? null,
        type ?? null,
        cover_url ?? null,
        description ?? null,
        type ? `media.${toLtreeLabel(type)}` : null,
      ]
    );

    if (rows.length === 0) {
      reply.code(404);
      return { error: "Not found" };
    }

    return rows[0];
  });

  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const forbidden = requireAdmin(request, reply);
    if (forbidden) {
      return forbidden;
    }

    const db = getDb();
    const { rowCount } = await db.query(
      "DELETE FROM media.media WHERE id::text = $1 OR external_id = $1",
      [request.params.id]
    );

    if (!rowCount) {
      reply.code(404);
      return { error: "Not found" };
    }

    return { success: true };
  });
}
