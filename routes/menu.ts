import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/authGuard";

const r = Router();

// public menu (used by frontend)
r.get("/", async (_, res) => {
  const cats = await prisma.category.findMany({
    orderBy: { position: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { position: "asc" },
        include: { media: { orderBy: { position: "asc" } } }
      }
    }
  });
  res.json(cats);
});

// admin CRUD
r.post("/category", requireAuth, requireAdmin, async (req, res) => {
  const { name, icon, position } = req.body; // name: localized JSON
  const c = await prisma.category.create({ data: { name, icon, position } });
  res.json(c);
});

r.put("/category/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, icon, position } = req.body;
  const c = await prisma.category.update({ where: { id: req.params.id }, data: { name, icon, position } });
  res.json(c);
});

r.delete("/category/:id", requireAuth, requireAdmin, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

r.post("/item", requireAuth, requireAdmin, async (req, res) => {
  const { categoryId, name, description, nutrition, ingredients, price, position } = req.body;
  const i = await prisma.menuItem.create({ data: { categoryId, name, description, nutrition, ingredients, price, position } });
  res.json(i);
});

r.put("/item/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, description, nutrition, ingredients, price, position, isAvailable } = req.body;
  const i = await prisma.menuItem.update({ where: { id: req.params.id }, data: { name, description, nutrition, ingredients, price, position, isAvailable } });
  res.json(i);
});

r.post("/item/:id/media", requireAuth, requireAdmin, async (req, res) => {
  const { type, url, position } = req.body; // IMAGE | VIDEO
  const m = await prisma.media.create({ data: { itemId: req.params.id, type, url, position } });
  res.json(m);
});

r.delete("/item/:id/media/:mediaId", requireAuth, requireAdmin, async (req, res) => {
  await prisma.media.delete({ where: { id: req.params.mediaId } });
  res.json({ ok: true });
});

export default r;

