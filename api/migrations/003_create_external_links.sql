-- Up Migration
CREATE TABLE media.external_links (
  media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  external_key TEXT NOT NULL,
  PRIMARY KEY (source_name, external_key)
);

CREATE INDEX idx_external_links_media_id ON media.external_links (media_id);

-- Down Migration
DROP TABLE IF EXISTS media.external_links;
