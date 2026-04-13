import { Router } from "express";
import { dbPool } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

/** Autocomplete: match display name or email (admin registers properties). */
router.get("/search", requireAdmin, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (q.length < 2) {
    res.json({ users: [] });
    return;
  }

  try {
    const pattern = `%${q}%`;
    const { rows } = await dbPool().query<{
      id: number;
      email: string;
      role: string;
      wallet_address: string | null;
      full_name: string | null;
    }>(
      `SELECT id, email, role, wallet_address, full_name
       FROM users
       WHERE wallet_address IS NOT NULL
         AND (
           full_name ILIKE $1
           OR email ILIKE $1
         )
       ORDER BY full_name NULLS LAST, email
       LIMIT 20`,
      [pattern],
    );
    res.json({ users: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "User search failed" });
  }
});

/** List users for admin UI. No password fields. */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await dbPool().query<{
      id: number;
      email: string;
      role: string;
      wallet_address: string | null;
      full_name: string | null;
    }>(
      `SELECT id, email, role, wallet_address, full_name
       FROM users
       ORDER BY id ASC`,
    );
    res.json({ users: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load users" });
  }
});

export default router;
