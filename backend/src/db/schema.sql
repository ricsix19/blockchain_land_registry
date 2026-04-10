-- Thesis prototype schema: run manually, e.g.
--   psql "$DATABASE_URL" -f src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user'))
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  property_id BIGINT UNIQUE NOT NULL,
  location TEXT NOT NULL,
  price_wei NUMERIC(78, 0) NOT NULL,
  owner_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) NOT NULL,
  property_id BIGINT NOT NULL,
  action VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
