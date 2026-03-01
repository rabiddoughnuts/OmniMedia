# API (Fastify)

## Project Description

Fastify + TypeScript backend for OmniMedia. It provides authentication, media catalog management, and per-user list operations backed by PostgreSQL.

## API Route List

Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Media
- `GET /media`
- `GET /media/:id`
- `POST /media`
- `PUT /media/:id`
- `PATCH /media/:id`
- `DELETE /media/:id`

List
- `GET /list`
- `POST /list`
- `DELETE /list/:mediaId`

## Setup Instructions

From `api/`:

```bash
npm install
npm run migrate
npm run dev
```

Optional DB bootstrap from repo root:

```bash
npm run setup:db
```

## Environment Variable Requirements

- `DATABASE_URL` (PostgreSQL connection string)
- `SESSION_SECRET` (minimum 32 characters)
- `MEDIA_ADMIN_TOKEN` (required for admin media mutations)

Default local database URL used by setup scripts:

- `postgres://postgres:postgres@localhost:5432/omnimediatrak`

## Planned stack
- Fastify
- TypeScript
- PostgreSQL
