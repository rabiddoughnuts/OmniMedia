# OmniMedia

Repository started during Wright State Hackathon 2026, for a multi-media all in one tracking.

## Project Description

OmniMedia is a full-stack media tracking app where users can browse a catalog, build personal lists, and manage progress across multiple media types.

The repo contains:

- `web/`: Next.js frontend
- `api/`: Fastify + PostgreSQL backend
- `packages/shared/`: shared types/schemas used across apps

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

### One-command full setup (recommended)

From repo root:

```bash
npm run setup:full
```

This command will:

- Install dependencies (root, shared, api, web)
- Build shared package
- Run API migrations
- Apply `api/sql/full_demo_bootstrap.sql` (if present)
- Start API and Web dev servers

If you only want DB/bootstrap setup without starting services:

```bash
npm run setup:db
```

### Manual setup

1. Start Postgres

```bash
docker compose up -d
```

2. Install dependencies

```bash
cd packages/shared
npm install
npm run build

cd ../../api
npm install

cd ../web
npm install
```

3. Set up database

```bash
cd api
npm run db:setup
```

4. Start API

```bash
cd api
npm run dev
```

5. Start Web

```bash
cd web
npm run dev
```

**API:** http://localhost:3001  
**Web:** http://localhost:3000

## Environment Variable Requirements

Required (minimum for local dev):

- `DATABASE_URL` (default used by setup script: `postgres://postgres:postgres@localhost:5432/omnimediatrak`)
- `SESSION_SECRET` (must be at least 32 characters)
- `MEDIA_ADMIN_TOKEN` (required for admin media create/update/delete routes)

Also used by frontend integration:

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3001`)

## Structure

- web/: Next.js app
- api/: Fastify API

## Documentation

- [docs/proposal.md](docs/proposal.md): Canonical build synopsis with links to in-depth write-ups for each part of the system.

Other notable documentation:
- [docs/Lab1.md](docs/Lab1.md) - Lab 01 client proposal and data model narrative.
- [docs/Midterm.md](docs/Midterm.md) - Midterm assignment requirements source text.
- [docs/Walker_Brandon_Storefront_Story_Wireframes.md](docs/Walker_Brandon_Storefront_Story_Wireframes.md) - Story, audience, and visual direction with wireframe references.
- [docs/OmniMediaTrak.pptx](docs/OmniMediaTrak.pptx) - Slide deck for OmniMediaTrak presentation materials.

## Assets

Fonts are self-hosted in [web/public/fonts](web/public/fonts):

- Poppins-Variable.woff2
- SpaceGrotesk-Variable.woff2

If you only have TTF files, either convert them to WOFF2 or update the
`@font-face` URLs in [web/src/app/globals.css](web/src/app/globals.css) to point
to the .ttf files.

## Pages

- / (home)
- /catalog (media catalog + filters)
- /list (personal list)
- /auth/register
- /auth/login
- /auth/logout

## Quick API check (curl)

Register:

```bash
curl -i -X POST http://localhost:3001/auth/register \
	-H "Content-Type: application/json" \
	-d '{"email":"test@example.com","password":"password123"}'
```

Login (save cookies):

```bash
curl -i -c cookies.txt -X POST http://localhost:3001/auth/login \
	-H "Content-Type: application/json" \
	-d '{"email":"test@example.com","password":"password123"}'
```

List (authenticated):

```bash
curl -i -b cookies.txt http://localhost:3001/list
```

Media admin (requires `MEDIA_ADMIN_TOKEN`):

```bash
curl -i -X POST http://localhost:3001/media \
	-H "Content-Type: application/json" \
	-H "X-Admin-Token: $MEDIA_ADMIN_TOKEN" \
	-d '{"title":"New Title","type":"book"}'
```
