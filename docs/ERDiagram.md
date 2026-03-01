# OmniMediaTrak ER Diagram

```mermaid
erDiagram
  USERS_USERS {
    UUID id PK
    VARCHAR(255) email "unique"
    VARCHAR(255) username "unique"
    VARCHAR(255) password_hash
    VARCHAR(255) role
    JSONB settings
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  AUTH_LOGIN_EVENTS {
    UUID id PK
    UUID user_id FK
    TIMESTAMPTZ event_time
  }

  INTERACTION_USER_LISTS {
    UUID id PK
    UUID user_id FK
    VARCHAR(255) name
    VARCHAR(255) description
    BOOLEAN is_public
    VARCHAR(255) list_type
    JSONB filter_definition
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  INTERACTION_USER_MEDIA {
    UUID user_id FK
    UUID media_id FK
    VARCHAR(255) status
    INT progress
    SMALLINT rating
    VARCHAR(255) notes
    TIMESTAMPTZ started_at
    TIMESTAMPTZ completed_at
    JSONB meta_snapshot
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  MEDIA_MEDIA {
    UUID id PK
    VARCHAR(255) external_id "unique"
    VARCHAR(255) media_type
    LTREE media_class
    VARCHAR(255) title
    DATE release_date
    VARCHAR(255) country_of_origin
    VARCHAR(255)[] creators
    VARCHAR(255) cover_url
    VARCHAR(255) description
    JSONB attributes
    TSVECTOR search_vector
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  INTERACTION_LIST_ITEMS {
    UUID list_id FK
    UUID media_id FK
    INT position
    TIMESTAMPTZ added_at
  }


  MEDIA_RELATIONSHIPS {
    UUID media_id FK
    UUID related_media_id FK
    VARCHAR(255) relation_type
    VARCHAR(255) notes
    SMALLINT weight
    TIMESTAMPTZ created_at
  }

  MEDIA_EXTERNAL_LINKS {
    UUID media_id FK
    VARCHAR(255) source_name
    VARCHAR(255) external_key
  }

  USERS_USERS ||--o{ AUTH_LOGIN_EVENTS : user_id

  USERS_USERS ||--o{ INTERACTION_USER_LISTS : user_id

  USERS_USERS ||--o{ INTERACTION_USER_MEDIA : user_id
  INTERACTION_USER_MEDIA }o--|| MEDIA_MEDIA : media_id

  INTERACTION_USER_LISTS ||--o{ INTERACTION_LIST_ITEMS : list_id
  MEDIA_MEDIA ||--o{ INTERACTION_LIST_ITEMS : media_id

  MEDIA_MEDIA ||--o{ MEDIA_RELATIONSHIPS : media_id
  MEDIA_MEDIA ||--o{ MEDIA_RELATIONSHIPS : related_media_id

  MEDIA_MEDIA ||--o{ MEDIA_EXTERNAL_LINKS : media_id
```

## Auth lifecycle note

- Current implementation: sessions/tokens are handled by backend application logic.
- Before scale hardening: move to DB-backed `auth.sessions` and `auth.tokens` (with `auth.login_events`) for durability, revocation, and multi-instance consistency.

## Attributes lifecycle note

- Current implementation: non-universal media attributes are stored in `media.media.attributes` JSONB.
- Before scale hardening: move type-specific attributes into media-specific tables.
