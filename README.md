# OmniMedia

Repository started during Wright State Hackathon 2026, for a multi-media all in one tracking.

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

## Quick start

### 0. Install dependencies

```bash
cd packages/shared
npm install
npm run build

cd ../../api
npm install

cd ../web
npm install
```

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

## API Routes

Auth
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

Media
- GET /media
- GET /media/:id
- POST /media
- PUT /media/:id
- PATCH /media/:id
- DELETE /media/:id

List
- GET /list
- POST /list
- DELETE /list/:mediaId

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
