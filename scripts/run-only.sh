#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/api"
WEB_DIR="$ROOT_DIR/web"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

need_cmd node
need_cmd npm
need_cmd psql

export DATABASE_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/omnimediatrak}"
export SESSION_SECRET="${SESSION_SECRET:-dev-session-secret-change-me-1234567890}"
export MEDIA_ADMIN_TOKEN="${MEDIA_ADMIN_TOKEN:-dev-admin-token}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:3001}"

db_is_ready() {
  psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1
}

try_start_db() {
  echo "Database is not reachable. Attempting to start PostgreSQL..."

  if command -v systemctl >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo systemctl start postgresql.service >/dev/null 2>&1 || true
    else
      systemctl start postgresql.service >/dev/null 2>&1 || true
    fi
  fi

  if command -v pg_ctlcluster >/dev/null 2>&1; then
    if command -v sudo >/dev/null 2>&1; then
      sudo pg_ctlcluster --all start >/dev/null 2>&1 || true
    else
      pg_ctlcluster --all start >/dev/null 2>&1 || true
    fi
  fi
}

echo "[1/3] Checking database connection"
if ! db_is_ready; then
  try_start_db
  sleep 2
fi

if ! db_is_ready; then
  echo "Unable to connect to PostgreSQL using DATABASE_URL=$DATABASE_URL" >&2
  echo "Start PostgreSQL manually, then re-run this script." >&2
  exit 1
fi

echo "[2/3] Starting API service"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

npm run dev --prefix "$API_DIR" &
API_PID=$!

sleep 2

if ! kill -0 "$API_PID" >/dev/null 2>&1; then
  echo "API failed to start." >&2
  exit 1
fi

echo "[3/3] Starting Web service"
npm run dev --prefix "$WEB_DIR"
