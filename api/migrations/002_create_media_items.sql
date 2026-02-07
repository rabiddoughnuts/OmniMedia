-- Up Migration
CREATE TABLE media_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL,
  cover_url TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_items_type ON media_items(type);
CREATE INDEX idx_media_items_title ON media_items(title);

-- Down Migration
DROP TABLE IF EXISTS media_items;
