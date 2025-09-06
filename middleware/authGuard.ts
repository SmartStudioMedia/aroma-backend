import { Request, Response, NextFunction } from "express";
import { verify } from "../auth";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = verify(header.slice(7));
    (req as any).auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = (req as any).auth;
  if (auth?.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
}

