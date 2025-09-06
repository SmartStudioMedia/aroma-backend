import { Router } from "express";
import { prisma } from "../db";
import { io } from "../socket";
import { Decimal } from "@prisma/client/runtime/library";

const r = Router();

// customers create order
r.post("/", async (req, res) => {
  const { items, type, tableId } = req.body; // items: [{itemId, qty}]
  const dbItems = await prisma.menuItem.findMany({ where: { id: { in: items.map((i:any)=>i.itemId) } } });
  const enriched = items.map((it:any) => {
    const found = dbItems.find(d => d.id === it.itemId)!;
    return {
      itemId: it.itemId,
      qty: it.qty,
      nameSnap: found.name,
      priceSnap: found.price
    };
  });
  const subtotal = enriched.reduce((s:any, it:any) => s + Number(it.priceSnap) * it.qty, 0);
  const total = subtotal; // add tax/fees here

  const order = await prisma.order.create({
    data: {
      tableId: type === "DINE_IN" ? tableId : null,
      type,
      subtotal: new Decimal(subtotal),
      total: new Decimal(total),
      items: { create: enriched }
    },
    include: { items: true, table: true }
  });

  io.emit("order:new", order); // push to dashboard
  res.json(order);
});

// staff/admin list and update
r.get("/", async (_, res) => {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: true, table: true, payment: true } });
  res.json(orders);
});

r.put("/:id/status", async (req, res) => {
  const { status } = req.body; // PENDING | CONFIRMED | FULFILLED | CANCELLED
  const o = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  io.emit("order:update", o);
  res.json(o);
});

export default r;

