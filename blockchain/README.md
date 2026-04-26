# Blockchain Land Registry (Hardhat)

Thesis prototype: a **minimal** Solidity registry only. There is no frontend, backend service, wallet UI, or payments in this package—only the `LandRegistry` contract, tests, and optional Ignition deploy.

## LandRegistry contract

Source: [`contracts/LandRegistry.sol`](contracts/LandRegistry.sol).

The deployer becomes the **admin**. Only the admin can **register** new properties (unique `propertyId`, location, price, and initial owner). The **current owner** can **transfer** ownership to another address (`price` is metadata for this prototype).

Fields per property: `propertyId`, `location`, `price`, `currentOwner`, `exists`. Events: `PropertyRegistered`, `PropertyTransferred`.

**Rules enforced in-contract:** admin-only registration; no duplicate `propertyId`; non-zero initial owner; transfers only for existing properties; only the current owner may transfer; non-zero `newOwner`.

## Compile

From this `blockchain` folder:

```shell
npx hardhat compile
```

## Test

Run all tests:

```shell
npx hardhat test
```

Run only the Mocha / TypeScript tests:

```shell
npx hardhat test mocha
```

## Deploy (Ignition)

**Persistent local node** (matches `CHAIN_RPC_URL=http://127.0.0.1:8545` in the backend):

1. Terminal A: `npx hardhat node`
2. Terminal B: `npx hardhat ignition deploy --network localhost ignition/modules/LandRegistry.ts`
3. Put the printed contract address into `backend/.env` as `LAND_REGISTRY_ADDRESS`.

In-memory chain only (does **not** populate the node on port 8545):

```shell
npx hardhat ignition deploy ignition/modules/LandRegistry.ts
```

Sepolia (set `SEPOLIA_RPC_URL` and `SEPOLIA_PRIVATE_KEY` via env or `npx hardhat keystore set`):

```shell
npx hardhat ignition deploy --network sepolia ignition/modules/LandRegistry.ts
```

For more on Hardhat 3, see the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3).
