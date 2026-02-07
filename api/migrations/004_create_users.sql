-- Up Migration
CREATE TABLE users.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users.users(email);
CREATE UNIQUE INDEX idx_users_email_lower ON users.users (LOWER(email));

-- Down Migration
DROP TABLE IF EXISTS users.users;
