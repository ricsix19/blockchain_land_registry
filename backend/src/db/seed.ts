import "dotenv/config";
import bcrypt from "bcryptjs";
import { dbPool } from "./pool.js";

/**
 * Demo wallets: Hardhat default accounts #0 and #1 (local chain only).
 * Align PROPERTY_TRANSFER_PRIVATE_KEY / registration with these for end-to-end demos.
 */
const ADMIN_WALLET = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const BUYER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

/**
 * Inserts demo users for local development (idempotent on email).
 * Run after applying schema.sql (and migrate-add-wallet-address.sql if upgrading).
 */
async function main(): Promise<void> {
  const password = "demo";
  const hash = bcrypt.hashSync(password, 10);

  await dbPool().query(
    `INSERT INTO users (email, password_hash, role, wallet_address)
     VALUES ($1, $2, 'admin', $3)
     ON CONFLICT (email) DO UPDATE SET
       wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address)`,
    ["admin@example.com", hash, ADMIN_WALLET],
  );

  await dbPool().query(
    `INSERT INTO users (email, password_hash, role, wallet_address)
     VALUES ($1, $2, 'user', $3)
     ON CONFLICT (email) DO UPDATE SET
       wallet_address = COALESCE(EXCLUDED.wallet_address, users.wallet_address)`,
    ["buyer@example.com", hash, BUYER_WALLET],
  );

  console.log("Seed complete:");
  console.log(`  admin@example.com / ${password} → ${ADMIN_WALLET}`);
  console.log(`  buyer@example.com / ${password} → ${BUYER_WALLET}`);
  await dbPool().end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
