import { Router } from "express";
import { prisma } from "../db";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const r = Router();

r.post("/stripe/:orderId", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: order.items.map((it) => ({
      price_data: {
        currency: "eur",
        product_data: { name: (it.nameSnap as any).en || "Item" },
        unit_amount: Math.round(Number(it.priceSnap) * 100),
      },
      quantity: it.qty,
    })),
    success_url: `${process.env.BASE_URL}/payments/stripe/success?order=${order.id}`,
    cancel_url: `${process.env.BASE_URL}/payments/stripe/cancel?order=${order.id}`,
  });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { provider: "STRIPE", amount: order.total, providerRef: session.id },
    create: { orderId: order.id, provider: "STRIPE", amount: order.total, providerRef: session.id }
  });

  res.json({ url: session.url });
});

export default r;

