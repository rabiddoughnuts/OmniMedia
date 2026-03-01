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

function toLtreeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_");
}

type MediaQuery = {
  page?: string;
  pageSize?: string;
  type?: string;
  q?: string;
};

type MediaCreateInput = {
  external_id?: string | null;
  title: string;
  type: string;
  cover_url?: string | null;
  description?: string | null;
};

type MediaUpdateInput = {
  external_id?: string | null;
  title?: string | null;
  type?: string | null;
  cover_url?: string | null;
  description?: string | null;
};

export async function listMedia(query: MediaQuery) {
  const db = getDb();
  const page = parsePage(query.page);
  const pageSize = parsePageSize(query.pageSize);
  const offset = (page - 1) * pageSize;

  const filters: string[] = [];
  const values: Array<string | number> = [];

  if (query.type) {
    values.push(query.type);
    filters.push(`media_type = $${values.length}`);
  }

  if (query.q) {
    values.push(`%${query.q}%`);
    filters.push(`title ILIKE $${values.length}`);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM media.media ${whereClause}`,
    values
  );

  values.push(pageSize, offset);
  const itemsResult = await db.query(
    `SELECT id,
            external_id,
            title,
            media_type AS type,
            media_class,
            release_date,
            country_of_origin,
            creators,
            cover_url,
            description,
            attributes,
            search_vector,
            created_at,
            updated_at
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
}

export async function getMediaByIdOrExternal(id: string) {
  const db = getDb();
  const { rows } = await db.query(
    `SELECT id,
            external_id,
            title,
            media_type AS type,
            media_class,
            release_date,
            country_of_origin,
            creators,
            cover_url,
            description,
            attributes,
            search_vector,
            created_at,
            updated_at
     FROM media.media
     WHERE id::text = $1 OR external_id = $1
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
}

export async function createMedia(input: MediaCreateInput) {
  const db = getDb();
  const { rows } = await db.query(
    `INSERT INTO media.media (external_id, media_type, media_class, title, cover_url, description)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, external_id, title, media_type AS type, cover_url, description`,
    [
      input.external_id ?? null,
      input.type,
      `media.${toLtreeLabel(input.type)}`,
      input.title,
      input.cover_url ?? null,
      input.description ?? null,
    ]
  );

  return rows[0];
}

export async function updateMedia(id: string, input: MediaUpdateInput) {
  const db = getDb();
  // TODO: Revisit nullable clearing behavior once DB design is finalized.
  const hasExternalId = Object.prototype.hasOwnProperty.call(input, "external_id");
  const hasTitle = Object.prototype.hasOwnProperty.call(input, "title");
  const hasType = Object.prototype.hasOwnProperty.call(input, "type");
  const hasCoverUrl = Object.prototype.hasOwnProperty.call(input, "cover_url");
  const hasDescription = Object.prototype.hasOwnProperty.call(input, "description");
  const mediaClass = input.type ? `media.${toLtreeLabel(input.type)}` : null;

  const { rows } = await db.query(
    `UPDATE media.media
     SET external_id = CASE WHEN $2 THEN $3 ELSE external_id END,
         title = CASE WHEN $4 THEN $5 ELSE title END,
         media_type = CASE WHEN $6 THEN $7 ELSE media_type END,
         media_class = CASE WHEN $6 THEN $8 ELSE media_class END,
         cover_url = CASE WHEN $9 THEN $10 ELSE cover_url END,
         description = CASE WHEN $11 THEN $12 ELSE description END,
         updated_at = NOW()
     WHERE id::text = $1 OR external_id = $1
     RETURNING id, external_id, title, media_type AS type, cover_url, description`,
    [
      id,
      hasExternalId,
      input.external_id ?? null,
      hasTitle,
      input.title ?? null,
      hasType,
      input.type ?? null,
      mediaClass,
      hasCoverUrl,
      input.cover_url ?? null,
      hasDescription,
      input.description ?? null,
    ]
  );

  return rows[0] ?? null;
}

export async function deleteMedia(id: string) {
  const db = getDb();
  const { rowCount } = await db.query(
    "DELETE FROM media.media WHERE id::text = $1 OR external_id = $1",
    [id]
  );

  return (rowCount ?? 0) > 0;
}
