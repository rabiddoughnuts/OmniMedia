import json
import re
from pathlib import Path
from typing import Any

DATA_DIR = Path("/run/media/brandon/EEB0F0D1B0F0A0EF/Classes/CS2800/final-project-rabiddoughnuts/Data")
OUT_FILE = Path("/run/media/brandon/EEB0F0D1B0F0A0EF/Classes/CS3800/OmniMedia/api/sql/full_demo_bootstrap.sql")

PASSWORD_HASH = "$2a$10$7EqJtq98hPqEX7fNZaFWoOHiM7R.6z6f/9T7VDaRao7IhiHBpjz2"  # password

USERS = [
    {
        "name": "Brandon Walker",
        "email": "brandon.walker.demo@omnimediatrak.local",
        "settings": {"theme": "dark", "density": "comfortable", "accent": "purple"},
    },
    {
        "name": "Sydney Walker",
        "email": "sydney.walker.demo@omnimediatrak.local",
        "settings": {"theme": "light", "density": "compact", "accent": "teal"},
    },
    {
        "name": "Emelia Walker",
        "email": "emelia.walker.demo@omnimediatrak.local",
        "settings": {"theme": "dark", "density": "compact", "accent": "gold"},
    },
    {
        "name": "Everett Walker",
        "email": "everett.walker.demo@omnimediatrak.local",
        "settings": {"theme": "light", "density": "comfortable", "accent": "blue"},
    },
    {
        "name": "Rupert Walker",
        "email": "rupert.walker.demo@omnimediatrak.local",
        "settings": {"theme": "dark", "density": "spacious", "accent": "red"},
    },
    {
        "name": "Basil Walker",
        "email": "basil.walker.demo@omnimediatrak.local",
        "settings": {"theme": "light", "density": "spacious", "accent": "green"},
    },
]

TYPE_MAP = {
    "Anime": "anime",
    "Audiobooks": "audiobook",
    "Books": "book",
    "Comics": "comic",
    "Games": "game",
    "LightNovels": "light_novel",
    "LiveEvents": "live_event",
    "Manga": "manga",
    "Movies": "movie",
    "Music": "music",
    "Podcasts": "podcast",
    "Shows": "show",
    "VisualNovels": "visual_novel",
    "WebNovels": "web_novel",
    "Webseries": "web_series",
    "Webtoons": "webtoon",
}


def strip_comments(raw: str) -> str:
    raw = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
    raw = re.sub(r"//.*", "", raw)
    raw = re.sub(r",\s*([}\]])", r"\1", raw)
    return raw


def sql_string(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "item"


def parse_year(raw_year: Any) -> int | None:
    if raw_year is None:
        return None
    if isinstance(raw_year, int):
        return raw_year
    txt = str(raw_year)
    m = re.search(r"(19|20)\d{2}", txt)
    if not m:
        return None
    return int(m.group(0))


def parse_creators(raw_creator: Any) -> list[str]:
    if raw_creator is None:
        return []
    txt = str(raw_creator).strip()
    if not txt:
        return []
    txt = re.sub(r"\b(Author|Artist|Writer|Director|Developer|Host|Producer|Narrator|Composer|Organizer|Mangaka|Creator|Studio|Headliner|Original Author)\s*:\s*", "", txt)
    parts = [p.strip() for p in re.split(r",| and ", txt) if p.strip()]
    return parts[:10]


def jsonb_sql(obj: dict[str, Any]) -> str:
    return sql_string(json.dumps(obj, ensure_ascii=False)) + "::jsonb"


def load_media_rows() -> tuple[list[dict[str, Any]], list[str]]:
    rows: list[dict[str, Any]] = []
    media_types: list[str] = []

    for file_path in sorted(DATA_DIR.glob("*.json")):
        raw = file_path.read_text(encoding="utf-8")
        data = json.loads(strip_comments(raw))
        if not isinstance(data, dict) or not data:
            continue

        top_key = next(iter(data.keys()))
        items = data[top_key]
        if not isinstance(items, list):
            continue

        media_type = TYPE_MAP.get(top_key, slugify(top_key))
        if media_type not in media_types:
            media_types.append(media_type)

        seen_external: set[str] = set()

        for idx, item in enumerate(items, start=1):
            if not isinstance(item, dict):
                continue
            title = str(item.get("title", "")).strip()
            if not title:
                continue

            year = parse_year(item.get("year_of_release"))
            external_base = f"{media_type}:{slugify(title)}:{year or 'na'}"
            external_id = external_base
            suffix = 2
            while external_id in seen_external:
                external_id = f"{external_base}:{suffix}"
                suffix += 1
            seen_external.add(external_id)

            release_date = f"{year:04d}-01-01" if year else None
            country = item.get("country_of_origin")
            synopsis = item.get("synopsis")
            creators = parse_creators(item.get("creator"))

            base_keys = {"title", "country_of_origin", "creator", "synopsis", "year_of_release"}
            attributes = {k: v for k, v in item.items() if k not in base_keys}
            attributes["source_category"] = top_key
            attributes["source_file"] = file_path.name

            rows.append(
                {
                    "external_id": external_id,
                    "media_type": media_type,
                    "media_class": f"media.{media_type}",
                    "title": title,
                    "release_date": release_date,
                    "country_of_origin": str(country).strip() if country is not None else None,
                    "creators": creators,
                    "cover_url": None,
                    "description": str(synopsis).strip() if synopsis is not None else None,
                    "attributes": attributes,
                }
            )

    return rows, media_types


def write_sql() -> None:
    media_rows, media_types = load_media_rows()
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    lines: list[str] = []
    lines.append("-- OmniMedia full demo bootstrap SQL")
    lines.append("-- Generated by api/scripts/generate_full_demo_sql.py")
    lines.append("")
    lines.append("BEGIN;")
    lines.append("")
    lines.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    lines.append("CREATE EXTENSION IF NOT EXISTS ltree;")
    lines.append("")
    lines.append("CREATE SCHEMA IF NOT EXISTS media;")
    lines.append("CREATE SCHEMA IF NOT EXISTS users;")
    lines.append("CREATE SCHEMA IF NOT EXISTS interaction;")
    lines.append("CREATE SCHEMA IF NOT EXISTS auth;")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS media.media (")
    lines.append("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),")
    lines.append("  external_id VARCHAR(255),")
    lines.append("  media_type VARCHAR(255) NOT NULL,")
    lines.append("  media_class LTREE NOT NULL,")
    lines.append("  title VARCHAR(255) NOT NULL,")
    lines.append("  release_date DATE,")
    lines.append("  country_of_origin VARCHAR(255),")
    lines.append("  creators VARCHAR(255)[],")
    lines.append("  cover_url VARCHAR(255),")
    lines.append("  description VARCHAR(255),")
    lines.append("  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,")
    lines.append("  search_vector TSVECTOR,")
    lines.append("  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    lines.append(");")
    lines.append("CREATE UNIQUE INDEX IF NOT EXISTS idx_media_external_id_unique ON media.media (external_id);")
    lines.append("CREATE INDEX IF NOT EXISTS idx_media_type ON media.media (media_type);")
    lines.append("CREATE INDEX IF NOT EXISTS idx_media_title ON media.media (title);")
    lines.append("CREATE INDEX IF NOT EXISTS idx_media_attributes ON media.media USING GIN (attributes);")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS media.external_links (")
    lines.append("  media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,")
    lines.append("  source_name VARCHAR(255) NOT NULL,")
    lines.append("  external_key VARCHAR(255) NOT NULL,")
    lines.append("  PRIMARY KEY (source_name, external_key)")
    lines.append(");")
    lines.append("CREATE INDEX IF NOT EXISTS idx_external_links_media_id ON media.external_links (media_id);")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS users.users (")
    lines.append("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),")
    lines.append("  email VARCHAR(255) UNIQUE NOT NULL,")
    lines.append("  password_hash TEXT NOT NULL,")
    lines.append("  settings JSONB NOT NULL DEFAULT '{}'::jsonb,")
    lines.append("  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    lines.append(");")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS interaction.user_media (")
    lines.append("  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,")
    lines.append("  media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,")
    lines.append("  status VARCHAR(255) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in-progress', 'completed', 'dropped')),")
    lines.append("  progress INT,")
    lines.append("  rating SMALLINT CHECK (rating >= 1 AND rating <= 10),")
    lines.append("  notes VARCHAR(255),")
    lines.append("  started_at TIMESTAMPTZ,")
    lines.append("  completed_at TIMESTAMPTZ,")
    lines.append("  meta_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,")
    lines.append("  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  PRIMARY KEY (user_id, media_id)")
    lines.append(");")
    lines.append("CREATE INDEX IF NOT EXISTS idx_user_media_user_status ON interaction.user_media (user_id, status);")
    lines.append("CREATE INDEX IF NOT EXISTS idx_user_media_media_id ON interaction.user_media (media_id);")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS interaction.user_lists (")
    lines.append("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),")
    lines.append("  user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,")
    lines.append("  name VARCHAR(255) NOT NULL,")
    lines.append("  description VARCHAR(255),")
    lines.append("  is_public BOOLEAN NOT NULL DEFAULT FALSE,")
    lines.append("  list_type VARCHAR(255) NOT NULL DEFAULT 'static' CHECK (list_type IN ('static', 'smart')),")
    lines.append("  filter_definition JSONB,")
    lines.append("  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  UNIQUE (user_id, name)")
    lines.append(");")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS interaction.list_items (")
    lines.append("  list_id UUID NOT NULL REFERENCES interaction.user_lists(id) ON DELETE CASCADE,")
    lines.append("  media_id UUID NOT NULL REFERENCES media.media(id) ON DELETE CASCADE,")
    lines.append("  position INT,")
    lines.append("  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  PRIMARY KEY (list_id, media_id)")
    lines.append(");")
    lines.append("")

    lines.append("CREATE TABLE IF NOT EXISTS auth.login_events (")
    lines.append("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),")
    lines.append("  user_id UUID REFERENCES users.users(id) ON DELETE SET NULL,")
    lines.append("  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),")
    lines.append("  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()")
    lines.append(");")
    lines.append("")

    lines.append("-- Users")
    for user in USERS:
        lines.append(
            "INSERT INTO users.users (email, password_hash, settings) "
            f"VALUES ({sql_string(user['email'])}, {sql_string(PASSWORD_HASH)}, {jsonb_sql(user['settings'])}) "
            "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, settings = EXCLUDED.settings;"
        )
    lines.append("")

    lines.append("-- Media catalog")
    for row in media_rows:
        creators_arr = "ARRAY[]::VARCHAR(255)[]" if not row["creators"] else "ARRAY[" + ", ".join(sql_string(v) for v in row["creators"]) + "]::VARCHAR(255)[]"
        lines.append(
            "INSERT INTO media.media (external_id, media_type, media_class, title, release_date, country_of_origin, creators, cover_url, description, attributes) "
            f"VALUES ({sql_string(row['external_id'])}, {sql_string(row['media_type'])}, {sql_string(row['media_class'])}, {sql_string(row['title'])}, "
            f"{sql_string(row['release_date'])}, {sql_string(row['country_of_origin'])}, {creators_arr}, {sql_string(row['cover_url'])}, "
            f"{sql_string((row['description'] or '')[:255])}, {jsonb_sql(row['attributes'])}) "
            "ON CONFLICT (external_id) DO NOTHING;"
        )
    lines.append("")

    lines.append("-- Base category lists (5 items/category/user)")
    for user_index, user in enumerate(USERS):
        first_name = user["name"].split()[0]
        for type_index, media_type in enumerate(media_types):
            list_name = f"{first_name} {media_type.replace('_', ' ').title()} Base List"
            description = f"Demo starter list for {media_type.replace('_', ' ')}"
            offset = (user_index + type_index) % 3
            lines.append(
                "INSERT INTO interaction.user_lists (user_id, name, description, is_public, list_type, filter_definition) "
                "SELECT u.id, "
                f"{sql_string(list_name)}, {sql_string(description)}, FALSE, 'static', NULL "
                "FROM users.users u "
                f"WHERE u.email = {sql_string(user['email'])} "
                "ON CONFLICT (user_id, name) DO NOTHING;"
            )
            lines.append(
                "INSERT INTO interaction.list_items (list_id, media_id, position, added_at) "
                "SELECT l.id, m.id, m.position, NOW() "
                "FROM interaction.user_lists l "
                "JOIN users.users u ON u.id = l.user_id "
                "JOIN LATERAL ("
                "  SELECT id, ROW_NUMBER() OVER (ORDER BY title) AS position "
                f"  FROM media.media WHERE media_type = {sql_string(media_type)} ORDER BY title LIMIT 5 OFFSET {offset}"
                ") m ON TRUE "
                f"WHERE u.email = {sql_string(user['email'])} AND l.name = {sql_string(list_name)} "
                "ON CONFLICT (list_id, media_id) DO NOTHING;"
            )
    lines.append("")

    lines.append("-- Optional: seed interaction.user_media from list items")
    lines.append(
        "INSERT INTO interaction.user_media (user_id, media_id, status, progress, rating, notes, meta_snapshot)\n"
        "SELECT l.user_id, li.media_id, 'planned', NULL, NULL, NULL, '{}'::jsonb\n"
        "FROM interaction.user_lists l\n"
        "JOIN interaction.list_items li ON li.list_id = l.id\n"
        "ON CONFLICT (user_id, media_id) DO NOTHING;"
    )
    lines.append("")

    lines.append("COMMIT;")

    OUT_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Generated {OUT_FILE}")
    print(f"Media rows: {len(media_rows)}")
    print(f"Media types: {len(media_types)} -> {', '.join(media_types)}")


if __name__ == "__main__":
    write_sql()
