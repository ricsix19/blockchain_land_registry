import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { dbPool } from "../db/pool.js";

const router = Router();

/**
 * Minimal login: email + password against `users.password_hash`.
 * Returns a JWT with `sub` (user id) and `role`.
 */
router.post("/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    res.status(400).json({ error: "email and password required" });
    return;
  }

  try {
    const { rows } = await dbPool().query<{
      id: number;
      password_hash: string;
      role: "admin" | "user";
    }>("SELECT id, password_hash, role FROM users WHERE email = $1", [email]);

    const row = rows[0];
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { sub: row.id, role: row.role },
      env.jwtSecret,
      { expiresIn: "8h" },
    );

    res.json({ token, role: row.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
