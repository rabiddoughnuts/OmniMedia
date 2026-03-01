#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHARED_DIR="$ROOT_DIR/packages/shared"
API_DIR="$ROOT_DIR/api"
WEB_DIR="$ROOT_DIR/web"
BOOTSTRAP_SQL="$API_DIR/sql/full_demo_bootstrap.sql"

MODE="run"
if [[ "${1:-}" == "--bootstrap-only" ]]; then
  MODE="bootstrap"
fi

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

echo "[1/6] Installing root dependencies"
npm install --prefix "$ROOT_DIR"

echo "[2/6] Installing and building shared package"
npm install --prefix "$SHARED_DIR"
npm run build --prefix "$SHARED_DIR"

echo "[3/6] Installing API and Web dependencies"
npm install --prefix "$API_DIR"
npm install --prefix "$WEB_DIR"

echo "[4/6] Checking database connection"
psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null

echo "[5/6] Running migrations"
npm run migrate --prefix "$API_DIR"

if [[ -f "$BOOTSTRAP_SQL" ]]; then
  echo "[6/6] Applying full demo bootstrap SQL"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$BOOTSTRAP_SQL"
else
  echo "[6/6] Skipping bootstrap SQL (not found at $BOOTSTRAP_SQL)"
fi

if [[ "$MODE" == "bootstrap" ]]; then
  echo "Bootstrap completed successfully."
  exit 0
fi

echo "Starting API and Web services..."

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

npm run dev --prefix "$WEB_DIR"
