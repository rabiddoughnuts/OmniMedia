# OmniMediaTrak Database Plan

This document is the authoritative database plan for OmniMediaTrak. It defines the exact schema, indexes, and scaling strategy for a single PostgreSQL database using schema isolation.

- `external_id VARCHAR(255)` (convenience ID, unique)
- `media_type VARCHAR(255) NOT NULL` (flat discriminator)
- `title VARCHAR(255) NOT NULL`
- `country_of_origin VARCHAR(255)`
- `creators VARCHAR(255)[]`
- `cover_url VARCHAR(255)`
- `description VARCHAR(255)`
- Single PostgreSQL database
- Schemas: `media`, `users`, `interaction`, `auth`
- Primary design goal: fast user-scoped queries at large scale with minimal cross-domain coupling

Note: Schema isolation is still under consideration. We may keep schema separation for clarity and permissions, or collapse to a single schema to simplify tooling and queries. This document currently assumes schema isolation, but the table layouts remain the same either way.
- `source_name VARCHAR(255) NOT NULL`
- `external_key VARCHAR(255) NOT NULL`

### 3.1 media.media (base table)

Core fields are shared across all media types; type-specific fields live in JSONB.

Current phase: non-universal/type-specific attributes are stored in `attributes` JSONB.

Before scale hardening: move type-specific attributes into media-specific tables.

- `notes VARCHAR(255)`

- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `external_id TEXT` (convenience ID, unique)
- `media_type TEXT NOT NULL` (flat discriminator)
- `media_class LTREE NOT NULL` (taxonomy hierarchy)
- `status VARCHAR(255) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'dropped'))`
- `notes VARCHAR(255)`
- `country_of_origin TEXT`
- `creators TEXT[]`
- `cover_url TEXT`
- `description TEXT`
- `attributes JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

-    - `name VARCHAR(255) NOT NULL`
-    - `description VARCHAR(255)`
-    - `list_type VARCHAR(255) NOT NULL CHECK (list_type IN ('static', 'smart'))`
Type-specific examples stored in `attributes`:

- Books: `isbn`, `publisher`, `page_count`, `edition`
- Games: `platforms`, `engine`, `playtime_hours`
- Audio: `narrator`, `duration_minutes`, `label`
- Events: `venue`, `capacity`, `event_type`

Indexes (exact):
-    - `email VARCHAR(255) NOT NULL UNIQUE`
-    - `username VARCHAR(255) UNIQUE`
-    - `password_hash VARCHAR(255) NOT NULL`
-    - `role VARCHAR(255) NOT NULL DEFAULT 'user'`
-    - `settings JSONB NOT NULL DEFAULT '{}'`

- `CREATE INDEX idx_media_title ON media.media (title);`
- `CREATE UNIQUE INDEX idx_media_external_id_unique ON media.media (external_id);`
- `CREATE INDEX idx_media_attributes ON media.media USING GIN (attributes);`
- `CREATE INDEX idx_media_attr_isbn ON media.media ((attributes->>'isbn'));`
- `CREATE INDEX idx_media_attr_runtime_minutes ON media.media ((attributes->>'runtime_minutes'));`
-    - `filter_definition JSONB` (smart list functionality is included here; no separate smart_lists table)
- `CREATE INDEX idx_media_attr_platforms ON media.media USING GIN ((attributes->'platforms'));`
- `CREATE INDEX idx_media_attr_genres ON media.media USING GIN ((attributes->'genres'));`

### 3.2 media.external_links (ingest bridge)

Maps canonical media to external sources and IDs.

Columns:

- `media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE`
- `source_name TEXT NOT NULL`
- `external_key TEXT NOT NULL`
- `PRIMARY KEY (source_name, external_key)`

Index:

- `CREATE INDEX idx_external_links_media_id ON media.external_links (media_id);`

### 3.3 media.relationships (explicit graph)

Models sequels, prequels, adaptations, and shared universes across all media types.

Columns:

- `media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE`
- `related_media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE`
- `relation_type media.relation_type NOT NULL`
- `notes TEXT`
- `weight SMALLINT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `PRIMARY KEY (media_id, related_media_id, relation_type)`

Indexes:

- `CREATE INDEX idx_relationships_media_id ON media.relationships (media_id);`
- `CREATE INDEX idx_relationships_related_id ON media.relationships (related_media_id);`
- `CREATE INDEX idx_relationships_type ON media.relationships (relation_type);`

Enum note: Lab1 describes `relation_type` values as `sequel`, `prequel`, `adaptation`, `spin-off`, and `shared-universe`. The database plan models these as a dedicated enum type (`media.relation_type`). If we keep the enum, its allowed values should match the Lab1 list (or the list should be updated to match the enum definition).

## 4. Interaction Schema (User Data)

### 4.1 interaction.user_media (partitioned)

This is the largest table. It is hash-partitioned by `user_id` to guarantee pruning on every user-scoped query.

Columns:

- `user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE`
- `media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE`
- `status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'dropped'))`
- `progress INT`
- `rating SMALLINT CHECK (rating >= 1 AND rating <= 10)`
- `notes TEXT`
- `started_at TIMESTAMPTZ`
- `completed_at TIMESTAMPTZ`
- `meta_snapshot JSONB NOT NULL DEFAULT '{}'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `PRIMARY KEY (user_id, media_id)`

Partitioning:

- `PARTITION BY HASH (user_id)`
- Start with 16 partitions (`MODULUS 16`), increase as row counts grow

Indexes:

- `CREATE INDEX idx_user_media_user_id ON interaction.user_media (user_id);`
- `CREATE INDEX idx_user_media_user_status ON interaction.user_media (user_id, status);`
- `CREATE INDEX idx_user_media_media_id ON interaction.user_media (media_id);`
- `CREATE INDEX idx_user_media_status ON interaction.user_media (status);`

### 4.2 Lists

Static lists:

- `interaction.user_lists`
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE`
    - `name TEXT NOT NULL`
    - `description TEXT`
    - `is_public BOOLEAN NOT NULL DEFAULT FALSE`
    - `list_type TEXT NOT NULL CHECK (list_type IN ('static', 'smart'))`
    - `filter_definition JSONB`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `interaction.list_items`
    - `list_id UUID NOT NULL REFERENCES interaction.user_lists(id) ON DELETE CASCADE`
    - `media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE`
    - `position INT`
    - `added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `PRIMARY KEY (list_id, media_id)`

Smart lists:

- `interaction.smart_lists`
    - `list_id UUID PRIMARY KEY REFERENCES interaction.user_lists(id) ON DELETE CASCADE`
    - `filter_definition JSONB NOT NULL`

## 5. Users and Auth

- `users.users`
    - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
    - `email TEXT NOT NULL UNIQUE`
    - `username TEXT UNIQUE`
    - `password_hash TEXT NOT NULL`
    - `role TEXT NOT NULL DEFAULT 'user'`
    - `profile_settings JSONB NOT NULL DEFAULT '{}'`
    - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
    - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Related profile/settings tables (future expansion)
- `auth.sessions`, `auth.tokens`, `auth.login_events`
- Current implementation note: sessions and tokens are backend-handled for now.
- Pre-scale requirement: transition to DB-backed `auth.sessions` and `auth.tokens` (with `auth.login_events`) before scale hardening.

## 6. Scaling Targets and Table Sizes

### 6.1 Media size

- Target: 10-50 million rows in `media.media`
- JSONB size grows with attribute richness; keep only necessary keys indexed

### 6.2 User list size

- Example: 10M users * 100 items each = 1B rows in `interaction.user_media`
- Hash partitioning ensures constant-time pruning by `user_id`

### 6.3 Relationships

- Expected to scale with media volume but remain sparse relative to `media.media`
- Relationship indexes keep traversal fast

## 7. Optimization and Maintenance

- Revisit JSONB expression indexes quarterly; drop unused indexes to avoid bloat
- Add partitions as row counts grow to keep each partition manageable
- Routine VACUUM/ANALYZE on hot partitions
- Maintain PITR backups and test restore quarterly
- Keep read replica warm for fast recovery

## 8. Notes on Indexes

Indexes are data structures that speed up lookups and sorting. They are not pre-filtered views; they are optimized lookup paths that avoid scanning full tables for common query patterns.
