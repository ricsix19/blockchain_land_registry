-- Run once on existing databases that were created before wallet_address existed:
--   psql "$DATABASE_URL" -f src/db/migrate-add-wallet-address.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42);
