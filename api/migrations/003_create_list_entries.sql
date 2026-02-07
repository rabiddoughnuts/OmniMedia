-- Up Migration
CREATE TABLE list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'planned',
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, media_id)
);

CREATE INDEX idx_list_entries_user_id ON list_entries(user_id);
CREATE INDEX idx_list_entries_media_id ON list_entries(media_id);
CREATE INDEX idx_list_entries_status ON list_entries(status);

-- Down Migration
DROP TABLE IF EXISTS list_entries;
