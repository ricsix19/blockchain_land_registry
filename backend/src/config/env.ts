/**
 * Central placeholder for environment variables.
 * More variables are added as features land (database, chain, auth).
 */
function intOr(defaultPort: string): number {
  const n = parseInt(process.env.PORT ?? defaultPort, 10);
  return Number.isFinite(n) ? n : parseInt(defaultPort, 10);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: intOr("3000"),
  /** Required once database features are used */
  databaseUrl: process.env.DATABASE_URL ?? "",
};
