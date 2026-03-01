-- Up Migration
-- Align short-term demo structure:
-- - Backend-managed sessions/tokens for now (no auth.sessions table)
-- - Keep explicit auth.login_events audit log
-- - Keep user settings on users.users

ALTER TABLE users.users
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

ALTER TABLE auth.login_events
  ADD COLUMN IF NOT EXISTS event_time TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE auth.login_events
SET event_time = created_at
WHERE event_time IS NULL;

DROP TABLE IF EXISTS auth.sessions;
DROP TABLE IF EXISTS auth.tokens;

-- Down Migration
-- Recreate dropped auth tables and remove demo columns.

CREATE TABLE IF NOT EXISTS auth.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE auth.login_events
  DROP COLUMN IF EXISTS event_time;

ALTER TABLE users.users
  DROP COLUMN IF EXISTS settings;
