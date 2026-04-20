import { Router } from "express";
import { ethers } from "ethers";
import { dbPool } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { assertChainConfig, getLandRegistryAsAdmin, parseWei } from "../services/landRegistryChain.js";

const router = Router();

router.use(requireAuth);

/** List mirrored properties from PostgreSQL (off-chain index). */
router.get("/", async (_req, res) => {
  try {
    const { rows } = await dbPool().query(
      `SELECT id, property_id, location, price_wei::text AS price_wei, owner_address, created_at
       FROM properties
       ORDER BY id ASC`,
    );
    res.json({ properties: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load properties" });
  }
});

/**
 * Admin registers, then stores a row for indexing.
 * Body: { propertyId, location, priceWei, initialOwnerUserId } or legacy { initialOwner }
 */
router.post("/", requireAdmin, async (req, res) => {
  try {
    assertChainConfig();
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
    return;
  }

  const rawId = req.body?.propertyId;
  const location = typeof req.body?.location === "string" ? req.body.location.trim() : "";
  let priceWei: bigint;
  try {
    priceWei = parseWei(req.body?.priceWei ?? req.body?.price);
  } catch {
    res.status(400).json({ error: "priceWei required (integer string, wei)" });
    return;
  }

  let initialOwner = "";
  const ownerUserIdRaw = req.body?.initialOwnerUserId;
  if (ownerUserIdRaw !== undefined && ownerUserIdRaw !== null && ownerUserIdRaw !== "") {
    const ownerUserId = parseInt(String(ownerUserIdRaw), 10);
    if (!Number.isFinite(ownerUserId)) {
      res.status(400).json({ error: "invalid initialOwnerUserId" });
      return;
    }
    const { rows } = await dbPool().query<{ wallet_address: string | null }>(
      "SELECT wallet_address FROM users WHERE id = $1",
      [ownerUserId],
    );
    const wa = rows[0]?.wallet_address?.trim() ?? "";
    if (!wa || !ethers.isAddress(wa)) {
      res.status(400).json({ error: "Selected user has no wallet address on file" });
      return;
    }
    initialOwner = wa;
  } else if (typeof req.body?.initialOwner === "string") {
    initialOwner = req.body.initialOwner.trim();
  }

  if (location === "" || initialOwner === "" || rawId === undefined || rawId === null) {
    res.status(400).json({
      error: "propertyId, location, and initialOwnerUserId (or legacy initialOwner) required",
    });
    return;
  }
  if (!ethers.isAddress(initialOwner)) {
    res.status(400).json({ error: "invalid initial owner address" });
    return;
  }

  let propertyId: bigint;
  try {
    propertyId = BigInt(rawId);
  } catch {
    res.status(400).json({ error: "invalid propertyId" });
    return;
  }

  const { rows: existingProp } = await dbPool().query<{ one: number }>(
    "SELECT 1 AS one FROM properties WHERE property_id = $1 LIMIT 1",
    [propertyId.toString()],
  );
  if (existingProp.length > 0) {
    res.status(409).json({
      error:
        "This property ID is already registered in the database mirror. Re-registration is not allowed.",
    });
    return;
  }

  const registry = getLandRegistryAsAdmin();

  try {
    const tx = await registry.registerProperty(
      propertyId,
      location,
      priceWei,
      initialOwner,
    );
    const receipt = await tx.wait();
    const txHash = receipt?.hash ?? tx.hash;

    try {
      await dbPool().query(
        `INSERT INTO properties (property_id, location, price_wei, owner_address)
         VALUES ($1, $2, $3, $4)`,
        [propertyId.toString(), location, priceWei.toString(), initialOwner.toLowerCase()],
      );
    } catch (dbErr: unknown) {
      const code = typeof dbErr === "object" && dbErr !== null && "code" in dbErr ? String((dbErr as { code: unknown }).code) : "";
      if (code === "23505") {
        res.status(409).json({
          error: "This property ID is already registered. Re-registration is not allowed.",
        });
        return;
      }
      throw dbErr;
    }

    await dbPool().query(
      `INSERT INTO transactions (tx_hash, property_id, action) VALUES ($1, $2, 'register')`,
      [txHash, propertyId.toString()],
    );

    res.status(201).json({ txHash, propertyId: propertyId.toString() });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "Registration failed", detail: String(e) });
  }
});

//Deprecated do not use
// router.post("/:id/buy", async (_req, res) => {
//   res.status(410).json({
//     error:
//       "Direct purchase is disabled. Submit a purchase request first; a registrar approves it before the chain transfer runs.",
//   });
// });

export default router;
