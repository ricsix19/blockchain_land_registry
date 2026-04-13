-- Run on existing DBs:
--   psql "$DATABASE_URL" -f src/db/migrate-purchase-requests.sql

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
