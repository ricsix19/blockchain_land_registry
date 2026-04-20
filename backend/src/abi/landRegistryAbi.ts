/**
 * Minimal ABI for LandRegistry (mirrors blockchain/contracts/LandRegistry.sol).
 * Kept in-repo so the backend does not depend on compiled artifacts being git-tracked.
 */
export const LAND_REGISTRY_ABI = [
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "propertyId", type: "uint256" }],
    name: "getProperty",
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "location", type: "string" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "address", name: "currentOwner", type: "address" },
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "bool", name: "pendingTransfer", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "string", name: "location", type: "string" },
      { internalType: "uint256", name: "price", type: "uint256" },
      { internalType: "address", name: "initialOwner", type: "address" },
    ],
    name: "registerProperty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "string", name: "newLocation", type: "string" },
    ],
    name: "updatePropertyLocation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "propertyId", type: "uint256" },
      { internalType: "address", name: "buyer", type: "address" },
    ],
    name: "requestPurchase",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "propertyId", type: "uint256" }],
    name: "approvePurchaseRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
