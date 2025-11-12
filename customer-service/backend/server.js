
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ordersRouter from "./routes/orders.js";
import authRouter from "./routes/auth.js";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));

const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || "http://localhost:4001";
app.get("/browse/restaurants", async (req, res) => {
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/restaurants`);
    res.json(data);
  } catch (e) { res.status(502).json({ error: "Provider unavailable" }); }
});
app.get("/browse/restaurants/:id/menus", async (req, res) => {
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/restaurants/${req.params.id}/menus`);
    res.json(data);
  } catch (e) { res.status(502).json({ error: "Provider unavailable" }); }
});

app.use("/orders", ordersRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => { res.sendFile(path.join(__dirname, "public", "index.html")); });

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => console.log(`✅ Customer-service JWT running at http://localhost:${PORT}`));
