import { Contract, ethers, JsonRpcProvider, Wallet } from "ethers";
import { LAND_REGISTRY_ABI } from "../abi/landRegistryAbi.js";
import { env } from "../config/env.js";

function chainConfigured(): boolean {
  return Boolean(
    env.chainRpcUrl && env.landRegistryAddress && env.registryAdminPrivateKey,
  );
}

function transferConfigured(): boolean {
  return Boolean(env.propertyTransferPrivateKey);
}

export function assertChainConfig(): void {
  if (!chainConfigured()) {
    throw new Error(
      "Chain env incomplete: set CHAIN_RPC_URL, LAND_REGISTRY_ADDRESS, REGISTRY_ADMIN_PRIVATE_KEY",
    );
  }
}

export function assertTransferConfig(): void {
  assertChainConfig();
  if (!transferConfigured()) {
    throw new Error("Set PROPERTY_TRANSFER_PRIVATE_KEY for ownership transfers");
  }
}

export function getProvider(): JsonRpcProvider {
  assertChainConfig();
  return new JsonRpcProvider(env.chainRpcUrl);
}

export function getLandRegistryAsAdmin(): Contract {
  const provider = getProvider();
  const wallet = new Wallet(env.registryAdminPrivateKey, provider);
  return new Contract(env.landRegistryAddress, LAND_REGISTRY_ABI, wallet);
}

export function getLandRegistryAsTransferSigner(): Contract {
  assertTransferConfig();
  const provider = getProvider();
  const wallet = new Wallet(env.propertyTransferPrivateKey, provider);
  return new Contract(env.landRegistryAddress, LAND_REGISTRY_ABI, wallet);
}

export function parseWei(value: unknown): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    return BigInt(value.trim());
  }
  throw new Error("Invalid price (wei)");
}
