# OmniMediaTrak MVP Plan (24-hour sprint)

**Goal:** ship a private-alpha, end-to-end slice: browse catalog + sign in + add to list.

This is a living plan for the current MVP milestone.

## MVP Scope (Phase 0 subset)

### Must-have user flows

- Sign in with email/password (local accounts only for MVP)
- Browse catalog list (public) with basic search/type filtering
- Add/remove a title to a personal list (planned/in-progress/completed)
- View personal list

### Data model (minimum)

- User
- MediaItem (title, type, cover_url)
- ListEntry (user_id, media_id, status, rating optional)

### Out of scope (24h)

- OIDC providers
- Reviews/notes
- Ingestion jobs
- Multi-region
- Search beyond simple text filter

## Tech choices for MVP

- Web: Next.js (App Router) + TypeScript
- API: Fastify + TypeScript
- DB: Postgres (single instance)
- Auth: session cookie + bcrypt/argon2

## 24-hour milestones

### 0-2h: project scaffolding

- Create web app and API folders
- Add basic env config
- Add database connection

### 2-6h: core data model

- Create migrations for User, MediaItem, ListEntry
- Seed minimal catalog (10-20 items)

### 6-12h: API endpoints

- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /media
- GET /media/:id
- POST /list
- GET /list
- DELETE /list/:mediaId

### 12-18h: web UI

- Public catalog list with search/type filters
- Auth pages (register/login/logout)
- Personal list page
- Shared layout (header, nav, ad placeholders)

### 18-24h: polish + demo

- Basic validation + error handling
- Loading states
- Seed data cleanup

## Success criteria

- A new user can register, log in, browse catalog, and save items to a list in a single session.
- Data persists across sessions.
