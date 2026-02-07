# OmniMedia

Repository started during Wright State Hackathon 2026, for a multi-media all in one tracking.

## Structure

- web/: Next.js app
- api/: Fastify API

## Quick start

### 1. Start Postgres

```bash
docker compose up -d
```

### 2. Set up the database

```bash
cd api
npm run db:setup
```

### 3. Start API

```bash
cd api
npm run dev
```

### 4. Start Web

```bash
cd web
npm run dev
```

**API:** http://localhost:3001
**Web:** http://localhost:3000
