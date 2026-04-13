import "dotenv/config";
import bcrypt from "bcryptjs";
import { dbPool } from "./pool.js";

/**
 * Inserts a demo admin for local development (idempotent on email).
 * Run after applying schema.sql.
 */
async function main(): Promise<void> {
  const email = "admin@example.com";
  const password = "demo";
  const hash = bcrypt.hashSync(password, 10);

  await dbPool().query(
    `INSERT INTO users (email, password_hash, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [email, hash],
  );

  console.log(`Seed complete (if missing): ${email} / ${password}`);
  await dbPool().end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
