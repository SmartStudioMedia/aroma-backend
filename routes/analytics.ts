import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/authGuard";

const r = Router();

r.get("/top-items", requireAuth, async (req, res) => {
  const data = await prisma.orderItem.groupBy({
    by: ["itemId"],
    _sum: { qty: true },
    orderBy: { _sum: { qty: "desc" } },
    take: 10
  });
  const items = await prisma.menuItem.findMany({ where: { id: { in: data.map(d => d.itemId) } } });
  const merged = data.map(d => {
    const it = items.find(i => i.id === d.itemId)!;
    return { itemId: d.itemId, name: it.name, totalQty: d._sum.qty };
  });
  res.json(merged);
});

r.get("/sales", requireAuth, async (req, res) => {
  const byDay = await prisma.order.groupBy({
    by: ["createdAt"],
    _sum: { total: true }
  });
  res.json(byDay);
});

export default r;

