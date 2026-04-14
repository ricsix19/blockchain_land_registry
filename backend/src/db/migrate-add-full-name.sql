-- Run on existing DBs:
--   psql "$DATABASE_URL" -f src/db/migrate-add-full-name.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
