import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  sub: number | string;
  role: "admin" | "user";
}

/** Validates `Authorization: Bearer <jwt>` and attaches `req.user`. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const payload = decoded as unknown as TokenPayload;
    const id =
      typeof payload.sub === "number" ? payload.sub : parseInt(String(payload.sub), 10);
    if (!Number.isFinite(id) || (payload.role !== "admin" && payload.role !== "user")) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    req.user = { id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Placeholder gate: extend with finer permissions later. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }
  next();
}
