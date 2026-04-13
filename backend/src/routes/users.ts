import { Router } from "express";
import { dbPool } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

/** List users for admin UI (e.g. initial owner picker). No password fields. */
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const { rows } = await dbPool().query<{
      id: number;
      email: string;
      role: string;
      wallet_address: string | null;
    }>(
      `SELECT id, email, role, wallet_address
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
