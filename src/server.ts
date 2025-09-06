import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { attachSocket } from "./socket";

import settingsRoutes from "./routes/settings";
import menuRoutes from "./routes/menu";
import tablesRoutes from "./routes/tables";
import ordersRoutes from "./routes/orders";
import checkoutRoutes from "./routes/checkout";
import paymentsRoutes from "./routes/payments";
import analyticsRoutes from "./routes/analytics";

const app = express();

// Stripe webhook needs raw body on that single route — mount before json()
app.use("/payments/stripe/webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/settings", settingsRoutes);
app.use("/menu", menuRoutes);
app.use("/tables", tablesRoutes);
app.use("/orders", ordersRoutes);
app.use("/checkout", checkoutRoutes);
app.use("/payments", paymentsRoutes);
app.use("/analytics", analyticsRoutes);

const httpServer = createServer(app);
attachSocket(httpServer);

const port = process.env.PORT || 8080;
httpServer.listen(port, () => console.log(`API listening on :${port}`));

