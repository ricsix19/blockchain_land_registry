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
  /** Browser origin for CORS (Vite default: http://localhost:5173) */
  corsOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
  /** Required once database features are used */
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  /** JSON-RPC URL (e.g. local Hardhat node or Sepolia) */
  chainRpcUrl: process.env.CHAIN_RPC_URL ?? "",
  landRegistryAddress: process.env.LAND_REGISTRY_ADDRESS ?? "",
  /** Must be the contract admin; used for registerProperty */
  registryAdminPrivateKey: process.env.REGISTRY_ADMIN_PRIVATE_KEY ?? "",
  /**
   * Must match the on-chain current owner when calling transfer ("buy").
   * Thesis prototype: single hot wallet; production would use user-controlled keys.
   */
  propertyTransferPrivateKey: process.env.PROPERTY_TRANSFER_PRIVATE_KEY ?? "",
};
