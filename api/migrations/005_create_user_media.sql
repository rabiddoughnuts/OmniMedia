-- Up Migration
CREATE TABLE interaction.user_media (
  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'dropped')),
  progress INT,
  rating SMALLINT CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  meta_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, media_id)
);

CREATE INDEX idx_user_media_user_id ON interaction.user_media (user_id);
CREATE INDEX idx_user_media_user_status ON interaction.user_media (user_id, status);
CREATE INDEX idx_user_media_media_id ON interaction.user_media (media_id);
CREATE INDEX idx_user_media_status ON interaction.user_media (status);

-- Down Migration
DROP TABLE IF EXISTS interaction.user_media;
