import { Router } from "express";
import { ethers } from "ethers";
import { dbPool } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { assertTransferConfig, getLandRegistryAsTransferSigner } from "../services/landRegistryChain.js";

const router = Router();

router.use(requireAuth);

/** Logged-in user: property IDs with a pending purchase request (for UI state). */
router.get("/my-pending", async (req, res) => {
  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const { rows } = await dbPool().query<{ property_id: string }>(
      `SELECT property_id::text AS property_id
       FROM purchase_requests
       WHERE buyer_user_id = $1 AND status = 'pending'`,
      [userId],
    );
    res.json({ propertyIds: rows.map((r) => r.property_id) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load pending requests" });
  }
});

function normAddr(a: string): string {
  return a.trim().toLowerCase();
}

/**
 * Buyer submits an off-chain purchase request (pending until admin approves).
 * Body: { propertyId, confirm: true }
 */
router.post("/", async (req, res) => {
  if (req.body?.confirm !== true) {
    res.status(400).json({
      error: "Send { propertyId, confirm: true } after acknowledging the simulated request.",
    });
    return;
  }

  const userId = req.user?.id;
  if (userId === undefined) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { rows: userRows } = await dbPool().query<{ wallet_address: string | null }>(
    "SELECT wallet_address FROM users WHERE id = $1",
    [userId],
  );
  const buyerWallet = userRows[0]?.wallet_address?.trim() ?? "";
  if (!buyerWallet || !ethers.isAddress(buyerWallet)) {
    res.status(400).json({ error: "Your account has no wallet address on file" });
    return;
  }

  const rawPid = req.body?.propertyId;
  let propertyId: bigint;
  try {
    propertyId = BigInt(rawPid);
  } catch {
    res.status(400).json({ error: "invalid propertyId" });
    return;
  }

  const { rows: propRows } = await dbPool().query<{ owner_address: string }>(
    "SELECT owner_address FROM properties WHERE property_id = $1",
    [propertyId.toString()],
  );
  const prop = propRows[0];
  if (!prop) {
    res.status(404).json({ error: "Property not found in registry mirror" });
    return;
  }
  if (normAddr(buyerWallet) === normAddr(prop.owner_address)) {
    res.status(400).json({
      error: "You already own this property.",
    });
    return;
  }

  const { rows: existing } = await dbPool().query<{ id: number }>(
    "SELECT id FROM purchase_requests WHERE property_id = $1 AND status = 'pending'",
    [propertyId.toString()],
  );
  if (existing[0]) {
    res.status(409).json({
      error: "A purchase request is already pending for this property.",
    });
    return;
  }

  try {
    await dbPool().query(
      `INSERT INTO purchase_requests (property_id, buyer_user_id, status)
       VALUES ($1, $2, 'pending')`,
      [propertyId.toString(), userId],
    );
    res.status(201).json({
      message: "Purchase request submitted. A registrar must approve it before ownership changes.",
      propertyId: propertyId.toString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to save purchase request" });
  }
});

/** Admin: pending requests with buyer and property details */
router.get("/pending", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await dbPool().query<{
      id: number;
      property_id: string;
      buyer_user_id: number;
      buyer_name: string | null;
      buyer_email: string;
      property_location: string;
      created_at: Date;
    }>(
      `SELECT pr.id,
 pr.property_id::text AS property_id,
              pr.buyer_user_id,
              u.full_name AS buyer_name,
              u.email AS buyer_email,
              p.location AS property_location,
              pr.created_at
       FROM purchase_requests pr
       JOIN users u ON u.id = pr.buyer_user_id
       JOIN properties p ON p.property_id = pr.property_id
       WHERE pr.status = 'pending'
       ORDER BY pr.created_at ASC`,
    );
    res.json({ requests: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load pending requests" });
  }
});

/**
 * Admin: approve request — executes on-chain transfer and updates mirror DB.
 */
router.post("/:id/approve", requireAdmin, async (req, res) => {
  try {
    assertTransferConfig();
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
    return;
  }

  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const requestId = parseInt(String(idParam), 10);
  if (!Number.isFinite(requestId)) {
    res.status(400).json({ error: "invalid request id" });
    return;
  }

  const { rows } = await dbPool().query<{
    property_id: string;
    buyer_user_id: number;
    status: string;
    buyer_wallet: string | null;
  }>(
    `SELECT pr.property_id::text AS property_id,
            pr.buyer_user_id,
            pr.status,
            u.wallet_address AS buyer_wallet
     FROM purchase_requests pr
     JOIN users u ON u.id = pr.buyer_user_id
     WHERE pr.id = $1`,
    [requestId],
  );
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Purchase request not found" });
    return;
  }
  if (row.status !== "pending") {
    res.status(400).json({ error: "This request is no longer pending" });
    return;
  }

  const newOwner = row.buyer_wallet?.trim() ?? "";
  if (!newOwner || !ethers.isAddress(newOwner)) {
    res.status(400).json({ error: "Buyer has no valid wallet on file" });
    return;
  }

  let propertyId: bigint;
  try {
    propertyId = BigInt(row.property_id);
  } catch {
    res.status(400).json({ error: "invalid property id on request" });
    return;
  }

  const { rows: propRows } = await dbPool().query<{ owner_address: string }>(
    "SELECT owner_address FROM properties WHERE property_id = $1",
    [row.property_id],
  );
  const prop = propRows[0];
  if (!prop) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  if (normAddr(newOwner) === normAddr(prop.owner_address)) {
    await dbPool().query(
      `UPDATE purchase_requests
       SET status = 'rejected', resolved_at = NOW()
       WHERE id = $1`,
      [requestId],
    );
    res.status(400).json({
      error: "Buyer already matches on-chain owner; request closed without transfer.",
    });
    return;
  }

  const registry = getLandRegistryAsTransferSigner();

  try {
    const tx = await registry.transferProperty(propertyId, newOwner);
    const receipt = await tx.wait();
    const txHash = receipt?.hash ?? tx.hash;

    await dbPool().query(
      `UPDATE properties SET owner_address = $1 WHERE property_id = $2`,
      [newOwner.toLowerCase(), row.property_id],
    );

    await dbPool().query(
      `INSERT INTO transactions (tx_hash, property_id, action) VALUES ($1, $2, 'transfer')`,
      [txHash, row.property_id],
    );

    await dbPool().query(
      `UPDATE purchase_requests
       SET status = 'approved', resolved_at = NOW(), approval_tx_hash = $2
       WHERE id = $1`,
      [requestId, txHash],
    );

    res.json({
      message: "Purchase approved; ownership transferred on-chain.",
      txHash,
      propertyId: row.property_id,
      newOwner,
    });
  } catch (e) {
    console.error(e);
    res.status(502).json({ error: "On-chain transfer failed", detail: String(e) });
  }
});

export default router;
