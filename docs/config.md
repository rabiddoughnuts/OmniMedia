# Configuration and Environment Variables

This document lists the primary configuration values used by the API and web app.

## API

- `DATABASE_URL`
  - Postgres connection string
- `SESSION_SECRET`
  - Session cookie signing secret
- `PORT`
  - API port (default: 3001)
- `CORS_ORIGIN`
  - Comma-separated list of allowed origins
- `TRUST_PROXY`
  - Set to `true`/`1`/`yes` behind a proxy
- `DB_POOL_MAX`
  - Max Postgres pool connections (default: 10)
- `DB_IDLE_TIMEOUT_MS`
  - Pool idle timeout in ms (default: 30000)
- `DB_CONN_TIMEOUT_MS`
  - Connection timeout in ms (default: 5000)
- `MEDIA_ADMIN_TOKEN`
  - Admin token for media CRUD
- `MEDIA_IMPORT_DIR`
  - Path to JSON import folder for ingestion

## Web

- `NEXT_PUBLIC_API_BASE_URL`
  - API base URL for the web app

## Local defaults

- Database: `postgres://postgres:postgres@localhost:5432/omnimediatrak`
- API: `http://localhost:3001`
- Web: `http://localhost:3000`

## Notes

- Keep secrets out of source control.
- For production, inject env vars via your deployment platform.
