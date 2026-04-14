-- Thesis prototype schema: run manually, e.g.
--   psql "$DATABASE_URL" -f src/db/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  wallet_address VARCHAR(42),
  full_name VARCHAR(255)
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

CREATE TABLE IF NOT EXISTS purchase_requests (
  id SERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL,
  buyer_user_id INT NOT NULL REFERENCES users (id),
  status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  approval_tx_hash VARCHAR(66)
);

CREATE UNIQUE INDEX IF NOT EXISTS purchase_requests_one_pending_per_property ON purchase_requests (property_id)
WHERE
  status = 'pending';
