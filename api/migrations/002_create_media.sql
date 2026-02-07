-- Up Migration
CREATE TABLE media.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  media_type TEXT NOT NULL,
  media_class LTREE NOT NULL,
  title TEXT NOT NULL,
  release_date DATE,
  country_of_origin TEXT,
  creators TEXT[],
  cover_url TEXT,
  description TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',
  collection_path LTREE,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_type ON media.media (media_type);
CREATE INDEX idx_media_title ON media.media (title);
CREATE INDEX idx_media_external_id ON media.media (external_id);
CREATE UNIQUE INDEX idx_media_external_id_unique ON media.media (external_id);
CREATE INDEX idx_media_class ON media.media USING GIST (media_class);
CREATE INDEX idx_media_collection_path ON media.media USING GIST (collection_path);
CREATE INDEX idx_media_attributes ON media.media USING GIN (attributes);

-- Down Migration
DROP TABLE IF EXISTS media.media;
