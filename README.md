# OmniMedia

Repository started during Wright State Hackathon 2026, for a multi-media all in one tracking.

## Structure

- web/: Next.js app
- api/: Fastify API

## Assets

Fonts are self-hosted in [web/public/fonts](web/public/fonts):

- Poppins-Variable.woff2
- SpaceGrotesk-Variable.woff2

If you only have TTF files, either convert them to WOFF2 or update the
`@font-face` URLs in [web/src/app/globals.css](web/src/app/globals.css) to point
to the .ttf files.

## Quick start

### 1. Start Postgres

```bash
docker compose up -d
```

If you do not have Docker Compose, you can use a native install:

```bash
sudo pacman -S postgresql
sudo -u postgres initdb -D /var/lib/postgres/data
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo -u postgres createdb omnimediatrak
```

### 2. Set up the database

```bash
cd api
npm run db:setup
```

Set these environment variables (example):

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/omnimediatrak"
export MEDIA_ADMIN_TOKEN="your-admin-token"
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
