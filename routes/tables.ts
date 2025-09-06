import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/authGuard";

const r = Router();

// generate QR slug like "t12-3f8kd"
function slugFor(number: number) {
  return `t${number}-${Math.random().toString(36).slice(2,7)}`;
}

// admin CRUD
r.get("/", requireAuth, async (_, res) => {
  const tables = await prisma.table.findMany({ orderBy: { number: "asc" } });
  res.json(tables);
});

r.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { number, name } = req.body;
  const t = await prisma.table.create({ data: { number, name, qrSlug: slugFor(number) } });
  res.json(t);
});

r.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { number, name, isActive } = req.body;
  const t = await prisma.table.update({ where: { id: req.params.id }, data: { number, name, isActive } });
  res.json(t);
});

// Public endpoint to resolve QR slug to table number (for frontend to embed in URL ?table=XX)
r.get("/qr/:slug", async (req, res) => {
  const t = await prisma.table.findUnique({ where: { qrSlug: req.params.slug } });
  if (!t) return res.status(404).json({ error: "not found" });
  res.json({ tableNumber: t.number, tableId: t.id });
});

export default r;

