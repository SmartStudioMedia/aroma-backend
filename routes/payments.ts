import { Router } from "express";
import Stripe from "stripe";
import { prisma } from "../db";
import paypal from "@paypal/checkout-server-sdk";

const r = Router();

// STRIPE WEBHOOK
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
r.post("/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${(err as any).message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await prisma.payment.findFirst({ where: { providerRef: session.id } });
    if (payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } });
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: "CONFIRMED" } });
    }
  }
  res.json({ received: true });
});

// PAYPAL CLIENT
function paypalClient() {
  const env = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID!, process.env.PAYPAL_CLIENT_SECRET!);
  return new paypal.core.PayPalHttpClient(env);
}

// Create PayPal order
r.post("/paypal/:orderId", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, include: { items: true } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: { currency_code: "EUR", value: order.total.toString() }
    }],
    application_context: {
      return_url: `${process.env.BASE_URL}/payments/paypal/success?order=${order.id}`,
      cancel_url: `${process.env.BASE_URL}/payments/paypal/cancel?order=${order.id}`
    }
  });

  const response = await paypalClient().execute(request);

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { provider: "PAYPAL", amount: order.total, providerRef: response.result.id },
    create: { orderId: order.id, provider: "PAYPAL", amount: order.total, providerRef: response.result.id }
  });

  const approve = response.result.links?.find(l => l.rel === "approve")?.href;
  res.json({ url: approve });
});

// Cash confirmation (staff marks as paid)
r.post("/cash/:orderId/paid", async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
  if (!order) return res.status(404).json({ error: "Order not found" });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    update: { provider: "CASH", amount: order.total, status: "PAID" },
    create: { orderId: order.id, provider: "CASH", amount: order.total, status: "PAID" }
  });
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
  res.json(updated);
});

export default r;

