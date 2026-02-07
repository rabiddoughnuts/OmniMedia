# Ingestion Design

OmniMediaTrak uses a local-first ingestion pipeline that populates the catalog with data from external sources. Ingestion is designed to be idempotent, transactional, and safe to re-run.

## Goals

- Import large JSON datasets quickly and safely
- Avoid duplicate records across sources
- Keep ingestion separate from web/API request paths

## Current ingestion flow

- Local/manual execution via seed script
- Reads JSON files from `MEDIA_IMPORT_DIR`
- Normalizes media fields into `media.media` and `attributes` JSONB
- Builds `external_id` using media type + title + year + creator slug
- Uses `ON CONFLICT (external_id) DO NOTHING` to avoid duplicates

## External ID strategy

- Base: `mediaType:title:year:creator`
- Slugify each component for stability
- On collision, add `-N` suffix

This approach keeps IDs deterministic while allowing duplicates with the same base identity.

## Idempotency guarantees

- Ingestion can be run repeatedly without creating duplicate rows
- Import is designed to tolerate missing fields
- Normalization avoids breaking on incomplete records

## Future expansion

- Add `media.external_links` for per-source mapping
- Track ingestion runs and source versions
- Introduce a queue (Redis + worker) when ingestion moves to scheduled jobs

## Validation

- Verify row counts and type distribution after import
- Check for unexpected nulls in key columns
- Validate external ID uniqueness
