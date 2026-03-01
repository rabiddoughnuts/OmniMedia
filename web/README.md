# Web (Next.js)

## Project Description

Next.js frontend for OmniMedia. It renders catalog, auth, and list pages and communicates with the Fastify API.

## API Route List

Frontend integrates with these backend routes:

Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Media
- `GET /media`
- `GET /media/:id`

List
- `GET /list`
- `POST /list`
- `DELETE /list/:mediaId`

## Setup Instructions

From `web/`:

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:3000`

## Environment Variable Requirements

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:3001`)

## Planned stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
