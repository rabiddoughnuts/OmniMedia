-- Up Migration

-- Relationship types for explicit media-to-media graph edges
CREATE TYPE media.relation_type AS ENUM (
  'sequel',
  'prequel',
  'spinoff',
  'same_universe',
  'adaptation',
  'remake',
  'crossover'
);

CREATE TABLE media.relationships (
  media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,
  related_media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,
  relation_type media.relation_type NOT NULL,
  notes TEXT,
  weight SMALLINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (media_id, related_media_id, relation_type)
);

CREATE INDEX idx_relationships_media_id ON media.relationships (media_id);
CREATE INDEX idx_relationships_related_id ON media.relationships (related_media_id);
CREATE INDEX idx_relationships_type ON media.relationships (relation_type);

-- Remove collection_path ltree (relationship graph replaces it)
DROP INDEX IF EXISTS idx_media_collection_path;
ALTER TABLE media.media DROP COLUMN IF EXISTS collection_path;

-- JSONB expression indexes for high-value fields
CREATE INDEX idx_media_attr_isbn ON media.media ((attributes->>'isbn'));
CREATE INDEX idx_media_attr_runtime_minutes ON media.media ((attributes->>'runtime_minutes'));
CREATE INDEX idx_media_attr_episode_count ON media.media ((attributes->>'episode_count'));
CREATE INDEX idx_media_attr_platforms ON media.media USING GIN ((attributes->'platforms'));
CREATE INDEX idx_media_attr_genres ON media.media USING GIN ((attributes->'genres'));

-- Partition interaction.user_media by user_id (hash)
ALTER TABLE interaction.user_media RENAME TO user_media_old;

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
) PARTITION BY HASH (user_id);

DROP INDEX IF EXISTS interaction.idx_user_media_user_id;
DROP INDEX IF EXISTS interaction.idx_user_media_user_status;
DROP INDEX IF EXISTS interaction.idx_user_media_media_id;
DROP INDEX IF EXISTS interaction.idx_user_media_status;

CREATE TABLE interaction.user_media_p0 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE interaction.user_media_p1 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 1);
CREATE TABLE interaction.user_media_p2 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 2);
CREATE TABLE interaction.user_media_p3 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 3);
CREATE TABLE interaction.user_media_p4 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 4);
CREATE TABLE interaction.user_media_p5 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 5);
CREATE TABLE interaction.user_media_p6 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 6);
CREATE TABLE interaction.user_media_p7 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 7);
CREATE TABLE interaction.user_media_p8 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 8);
CREATE TABLE interaction.user_media_p9 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 9);
CREATE TABLE interaction.user_media_p10 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 10);
CREATE TABLE interaction.user_media_p11 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 11);
CREATE TABLE interaction.user_media_p12 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 12);
CREATE TABLE interaction.user_media_p13 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 13);
CREATE TABLE interaction.user_media_p14 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 14);
CREATE TABLE interaction.user_media_p15 PARTITION OF interaction.user_media
  FOR VALUES WITH (MODULUS 16, REMAINDER 15);

CREATE INDEX idx_user_media_user_id ON interaction.user_media (user_id);
CREATE INDEX idx_user_media_user_status ON interaction.user_media (user_id, status);
CREATE INDEX idx_user_media_media_id ON interaction.user_media (media_id);
CREATE INDEX idx_user_media_status ON interaction.user_media (status);

INSERT INTO interaction.user_media
SELECT * FROM interaction.user_media_old;

DROP TABLE interaction.user_media_old;

-- Down Migration

-- Recreate non-partitioned user_media table
CREATE TABLE interaction.user_media_old (
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

INSERT INTO interaction.user_media_old
SELECT * FROM interaction.user_media;

DROP TABLE interaction.user_media;
ALTER TABLE interaction.user_media_old RENAME TO user_media;

CREATE INDEX idx_user_media_user_id ON interaction.user_media (user_id);
CREATE INDEX idx_user_media_user_status ON interaction.user_media (user_id, status);
CREATE INDEX idx_user_media_media_id ON interaction.user_media (media_id);
CREATE INDEX idx_user_media_status ON interaction.user_media (status);

DROP INDEX IF EXISTS idx_media_attr_isbn;
DROP INDEX IF EXISTS idx_media_attr_runtime_minutes;
DROP INDEX IF EXISTS idx_media_attr_episode_count;
DROP INDEX IF EXISTS idx_media_attr_platforms;
DROP INDEX IF EXISTS idx_media_attr_genres;

ALTER TABLE media.media ADD COLUMN collection_path LTREE;
CREATE INDEX idx_media_collection_path ON media.media USING GIST (collection_path);

DROP TABLE media.relationships;
DROP TYPE media.relation_type;
