# Backlog of Implementation for OmniMediaTrak

## Priority 0 - Validation + core UX

- UI: list status UI (status/rating/notes edits)
- API: relationships routes (media-to-media links)

## Priority 1 - UI parity polish

- UI: nav active state parity (li.active vs link)
- UI: home page tiles hook into tracking actions
- UI: register page parity with .register-form field rows
- UI: body data attribute parity (data-page, data-theme)
- UI: user profile page
- UI: specific media detail page

## Priority 2 - Platform follow-through

- API: OpenAPI-first contract + generated typed client
- UI: TanStack Query/Table + Tailwind adoption
- Data: Postgres FTS/pg_trgm for search
- Observability: Sentry + structured logging
- Mobile: Expo app start

## Stretch / Future phases

- Auth: OIDC providers (Google/Apple), account linking, 2FA
- Reviews: API + UI
- Ads/consent system, donate button functionality, social features, subscriptions

## Done (for history)

<!-- DONE: UI full column/filter coverage (controls bar, badges, clear, sort, search, columns). -->
<!-- DONE: UI home page parity with .intro/.welcome/.donate. -->
<!-- DONE: Convert the catalog/list views into the table-style layout (controls bar + table). -->
<!-- DONE: The current pages render only a table, no .controls-bar, .control-group, .filter-dropdown, .filter-menu, .filter-status, .link-button, .columns-dropdown, or #searchBox markup. See page.tsx and page.tsx. -->
<!-- DONE: Table action columns are missing. -->
<!-- DONE: Original media table adds "Add" buttons and list table includes row-level remove buttons; current tables are read-only. See page.tsx and page.tsx. -->
<!-- DONE: Add/remove from list in UI is missing. -->
<!-- DONE: API supports POST /list and DELETE /list/:mediaId, but the web catalog/list tables are read-only. See page.tsx and page.tsx. -->

<!-- Superseded: DB plan now lives in docs/database.md and migrations; kept here for archive only.
## DB Plan

OmniMediaTrak - Data Model & Database Architecture Rationale
Overview

OmniMediaTrak is a large-scale, user-centric media tracking platform designed to catalog and track all digitally trackable media types while supporting heterogeneous lists, cross-media comparison, and efficient user-scoped querying. The system prioritizes structured metadata, extensibility, and long-term scalability over encyclopedic depth.

The database architecture is designed to scale to hundreds of millions of users and billions of user-media interactions, similar to major media tracking and streaming platforms.

Core Design Principles

Single canonical record per media item

User-specific data strictly separated from global metadata

Schema evolution without disruptive migrations

Efficient user-scoped queries at extreme scale

Minimal redundancy across ingestion sources

Database-first filtering and sorting (not application-side)

Database Scope

Database Engine: PostgreSQL

Single Primary Database: omnimediatrak

Logical separation achieved via schemas, not multiple databases

Schema Layout
media schema — Canonical Media Data

Stores global, mostly read-only metadata for all media items.

Unified Media Table
CREATE TABLE media.media (
    id UUID PRIMARY KEY,
    media_type TEXT NOT NULL,
    media_class LTREE NOT NULL,
    title TEXT NOT NULL,
    release_date DATE,
    country_of_origin TEXT,
    creators TEXT[],
    attributes JSONB NOT NULL DEFAULT '{}',
    collection_path LTREE,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT now()
);

Key Concepts

media_type

Flat discriminator (movie, book, anime, game, etc.)

Used for ingestion logic and high-level UI behavior

media_class (ltree)

Hierarchical classification for grouping and filtering

Example paths:

written.books.webnovel

written.graphic_novel

video.series.anime

interactive.game.visual_novel

Enables queries like "all written media" or "all books"

attributes (JSONB)

Stores type-specific metadata (e.g. ISBN, runtime, episode count)

Avoids sparse columns and inheritance joins

Selectively indexed for high-value fields

collection_path (ltree, optional)

Represents franchise or universe membership

Example:

starwars.skywalker.trilogy.empire_strikes_back

Used for franchise browsing, not canonical relationships

External Source Mapping ("Rosetta Stone")
CREATE TABLE media.external_links (
    media_id UUID REFERENCES media.media(id),
    source_name TEXT NOT NULL,
    external_key TEXT NOT NULL,
    PRIMARY KEY (source_name, external_key)
);

Purpose:

De-duplicate media across ingestion sources

Allow multiple external IDs per media item

Centralize ingestion and reconciliation logic

users schema - Identity & Profile
users.users
users.preferences
users.settings

Contains only user identity and configuration data.

interaction schema - User-Specific Data

This schema contains the largest and most frequently accessed tables.

User-Media Tracking Table (Partitioned)
CREATE TABLE interaction.user_media (
    user_id UUID NOT NULL,
    media_id UUID NOT NULL,
    status TEXT NOT NULL,
    progress INT,
    rating SMALLINT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    meta_snapshot JSONB,
    PRIMARY KEY (user_id, media_id)
) PARTITION BY HASH (user_id);

Characteristics:

Stores all user-specific tracking data

No duplication of canonical media metadata

Partitioned by user_id to ensure scalability to billions of rows

All queries are user-scoped

Lists
Static Lists

Manual collections defined by users.

interaction.user_lists
interaction.list_items (list_id, media_id)

Smart Lists

Saved filters instead of stored items.

interaction.smart_lists (
    list_id,
    filter_definition JSONB
)

Smart lists are evaluated at runtime and cached, avoiding duplication and stale data.

auth schema — Authentication
auth.sessions
auth.tokens
auth.login_events

Isolated for security and auditing.

ingest schema — Data Ingestion & Maintenance
ingest.sources
ingest.import_jobs
ingest.import_logs
ingest.conflicts

Used exclusively by backend ingestion services.

Indexing Strategy (High-Level)

Composite indexes on (user_id, state), (user_id, rating), (user_id, updated_at)

Partial indexes for unfinished media

Targeted expression indexes on JSONB attributes

ltree indexes on media_class and collection_path

No global indexes on user interaction data

Indexes are designed strictly around known query patterns.

Cross-Media Comparison Strategy

Canonical data remains media-type specific

Cross-media sorting uses:

Shared base columns (release date, rating)

Computed or view-level normalization (e.g. estimated time)

No lossy canonical conversions stored permanently

Scalability Characteristics

Media tables remain relatively small and stable

Interaction tables scale linearly with user adoption

Partitioning ensures query locality

PostgreSQL handles total database size without issue

Caching and read replicas added incrementally

Non-Goals

No content hosting or streaming

No wiki-style deep lore modeling

No user-editable global metadata

No early sharding or multi-database architecture
-->
