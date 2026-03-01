import { getDb } from "../db.js";

type ListOrder = "um.updated_at" | "um.created_at";

type ListItemInput = {
  mediaId: string;
  status: string;
  rating?: number;
  notes?: string | null;
};

export async function fetchUserList(
  userId: string,
  pageSize: number,
  offset: number,
  orderColumn: ListOrder
) {
  const db = getDb();

  const totalResult = await db.query(
    "SELECT COUNT(*)::int AS total FROM interaction.user_media WHERE user_id = $1",
    [userId]
  );

  const { rows } = await db.query(
    `SELECT
      um.media_id AS id,
      um.status,
      um.progress,
      um.rating,
      um.notes,
      um.started_at,
      um.completed_at,
      um.meta_snapshot,
      um.created_at,
      um.updated_at,
      m.id AS media_row_id,
      m.external_id,
      m.title,
      m.media_type AS type,
      m.media_class,
      m.release_date,
      m.country_of_origin,
      m.creators,
      m.cover_url,
      m.description,
      m.attributes,
      m.search_vector,
      m.created_at AS media_created_at,
      m.updated_at AS media_updated_at
     FROM interaction.user_media um
     JOIN media.media m ON um.media_id = m.id
     WHERE um.user_id = $1
     ORDER BY ${orderColumn} DESC
     LIMIT $2 OFFSET $3`,
    [userId, pageSize, offset]
  );

  return {
    items: rows,
    total: totalResult.rows[0]?.total ?? 0,
  };
}

export async function addToUserList(userId: string, input: ListItemInput) {
  const db = getDb();

  const { rows: mediaCheck } = await db.query(
    "SELECT id FROM media.media WHERE id = $1",
    [input.mediaId]
  );

  if (mediaCheck.length === 0) {
    return { entry: null, mediaMissing: true };
  }

  const { rows } = await db.query(
    `INSERT INTO interaction.user_media
      (user_id, media_id, status, rating, notes, meta_snapshot)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, media_id)
     DO UPDATE SET status = $3, rating = $4, notes = $5, meta_snapshot = $6, updated_at = NOW()
     RETURNING *`,
    [userId, input.mediaId, input.status, input.rating, input.notes ?? null, {}]
  );

  return { entry: rows[0], mediaMissing: false };
}

export async function removeFromUserList(userId: string, mediaId: string) {
  const db = getDb();

  const { rowCount } = await db.query(
    "DELETE FROM interaction.user_media WHERE user_id = $1 AND media_id = $2",
    [userId, mediaId]
  );

  return rowCount ?? 0;
}
