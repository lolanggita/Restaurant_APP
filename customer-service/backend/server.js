import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

dotenv.config();

import authRouter from "./routes/auth.js";
import menuRouter from "./routes/menu.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import deliveryRouter from "./routes/delivery.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ==== STATIC FRONTEND ====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../frontend")));

// ==== PROVIDER API BASE URL ====
const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || "http://localhost:4001";

// ==== ROUTES TO GET PROVIDER DATA ====
app.get("/browse/restaurants", async (req, res) => {
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/restaurants`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: "Provider unavailable" });
  }
});

app.get("/browse/menus", async (req, res) => {
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/restaurants/1/menus`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: "Provider unavailable" });
  }
});

app.get("/browse/restaurants/1/menus", async (req, res) => {
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/restaurants/1/menus`);
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(502).json({ error: "Provider unavailable" });
  }
});


// ==== CUSTOMER CRUD API ====
app.use("/api/auth", authRouter);
app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/delivery", deliveryRouter);

// ==== BASE ROUTE ====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
  console.log(`✅ Customer-service running at http://localhost:${PORT}`);
});
