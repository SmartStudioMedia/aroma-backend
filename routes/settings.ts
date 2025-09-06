import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/authGuard";

const r = Router();

r.get("/", async (_, res) => {
  const s = await prisma.settings.findFirst({ where: { id: 1 } });
  res.json(s);
});

r.put("/", requireAuth, requireAdmin, async (req, res) => {
  const { brandName, logoUrl, primaryColor, secondaryColor, backgroundUrl, font, currency } = req.body;
  const s = await prisma.settings.upsert({
    where: { id: 1 },
    update: { brandName, logoUrl, primaryColor, secondaryColor, backgroundUrl, font, currency },
    create: { id: 1, brandName, logoUrl, primaryColor, secondaryColor, backgroundUrl, font, currency }
  });
  res.json(s);
});

export default r;

