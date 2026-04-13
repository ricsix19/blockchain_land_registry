import pg from "pg";
import { env } from "../config/env.js";

/**
 * Shared connection pool. Callers must have DATABASE_URL set in the environment.
 */
export function createPool(): pg.Pool {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }
  return new pg.Pool({ connectionString: env.databaseUrl });
}

/** Singleton pool for the running process (sufficient for the thesis prototype). */
let _pool: pg.Pool | undefined;

export function dbPool(): pg.Pool {
  if (!_pool) {
    _pool = createPool();
  }
  return _pool;
}
