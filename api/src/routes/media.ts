import type { FastifyInstance, FastifyPluginOptions } from "fastify";
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
  app.get<{ Querystring: MediaQuery }>("/", async (request) => {
    const db = getDb();
    const page = parsePage(request.query.page);
    const pageSize = parsePageSize(request.query.pageSize);
    const offset = (page - 1) * pageSize;

    const filters: string[] = [];
    const values: Array<string | number> = [];

    if (request.query.type) {
      values.push(request.query.type);
      filters.push(`type = $${values.length}`);
    }

    if (request.query.q) {
      values.push(`%${request.query.q}%`);
      filters.push(`title ILIKE $${values.length}`);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM media_items ${whereClause}`,
      values
    );

    values.push(pageSize, offset);
    const itemsResult = await db.query(
      `SELECT id, external_id, title, type, cover_url, description
       FROM media_items
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
      `SELECT id, external_id, title, type, cover_url, description
       FROM media_items
       WHERE id = $1 OR external_id = $1
       LIMIT 1`,
      [request.params.id]
    );

    if (rows.length === 0) {
      reply.code(404);
      return { message: "Not found" };
    }

    return rows[0];
  });
}
