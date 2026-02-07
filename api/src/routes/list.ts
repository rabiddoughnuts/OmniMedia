import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getDb } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

interface AddToListBody {
  mediaId: string;
  status: "planned" | "in-progress" | "completed" | "dropped";
  rating?: number;
  notes?: string;
}

type ListQuery = {
  page?: string;
  pageSize?: string;
  order?: "updated" | "created";
};

const ALLOWED_STATUSES = new Set([
  "planned",
  "in-progress",
  "completed",
  "dropped",
]);

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

function resolveOrder(order?: "updated" | "created"): string {
  if (order === "created") {
    return "um.created_at";
  }
  return "um.updated_at";
}

export async function listRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // All list routes require authentication
  app.addHook("onRequest", requireAuth);

  // Get user's list
  app.get<{ Querystring: ListQuery }>("/", async (request, reply) => {
    const db = getDb();
    const page = parsePage(request.query.page);
    const pageSize = parsePageSize(request.query.pageSize);
    const offset = (page - 1) * pageSize;
    const orderColumn = resolveOrder(request.query.order);

    const totalResult = await db.query(
      "SELECT COUNT(*)::int AS total FROM interaction.user_media WHERE user_id = $1",
      [request.session.userId]
    );

    const { rows } = await db.query(
      `SELECT
        um.media_id AS id,
        um.media_id,
        um.status,
        um.rating,
        um.notes,
        um.created_at,
        um.updated_at,
        m.title,
        m.media_type AS type,
        m.cover_url,
        m.description
       FROM interaction.user_media um
       JOIN media.media m ON um.media_id = m.id
       WHERE um.user_id = $1
       ORDER BY ${orderColumn} DESC
       LIMIT $2 OFFSET $3`,
      [request.session.userId, pageSize, offset]
    );

    return {
      items: rows,
      page,
      pageSize,
      total: totalResult.rows[0]?.total ?? 0,
    };
  });

  // Add to list
  app.post<{ Body: AddToListBody }>("/", async (request, reply) => {
    const { mediaId, status, rating, notes } = request.body;

    if (!mediaId || !status) {
      reply.code(400);
      return { error: "mediaId and status are required" };
    }

    if (!ALLOWED_STATUSES.has(status)) {
      reply.code(400);
      return { error: "Invalid status value" };
    }

    const db = getDb();

    // Check if media exists
    const { rows: mediaCheck } = await db.query(
      "SELECT id FROM media.media WHERE id = $1",
      [mediaId]
    );

    if (mediaCheck.length === 0) {
      reply.code(404);
      return { error: "Media not found" };
    }

    // Upsert list entry
    const { rows } = await db.query(
      `INSERT INTO interaction.user_media
        (user_id, media_id, status, rating, notes, meta_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, media_id)
       DO UPDATE SET status = $3, rating = $4, notes = $5, meta_snapshot = $6, updated_at = NOW()
       RETURNING *`,
      [request.session.userId, mediaId, status, rating, notes ?? null, {}]
    );

    return { entry: rows[0] };
  });

  // Remove from list
  app.delete<{ Params: { mediaId: string } }>("/:mediaId", async (request, reply) => {
    const db = getDb();

    const { rowCount } = await db.query(
      "DELETE FROM interaction.user_media WHERE user_id = $1 AND media_id = $2",
      [request.session.userId, request.params.mediaId]
    );

    if (rowCount === 0) {
      reply.code(404);
      return { error: "Entry not found" };
    }

    return { success: true };
  });
}