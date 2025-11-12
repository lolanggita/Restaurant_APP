import express from "express";
import db from "../db.js";
import axios from "axios";
import dotenv from "dotenv";
import { authMiddleware } from "../middleware/auth.js";

dotenv.config();
const router = express.Router();
const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || "http://localhost:4001";

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items[] required" });
    }
    const { data } = await axios.post(`${PROVIDER_BASE_URL}/internal/reserve`, { items });
    const reserved = data.reserved || data.items || [];
    const total = data.total || reserved.reduce((a,b)=>a + (b.subtotal||0), 0);

    db.run(
      "INSERT INTO orders(customer_name,user_id,total) VALUES (?,?,?)",
      [req.user.name || "Customer", req.user.id, total],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const orderId = this.lastID;
        const stmt = db.prepare("INSERT INTO order_items(order_id,menu_id,name,price,qty,subtotal) VALUES(?,?,?,?,?,?)");
        for (const it of reserved) {
          stmt.run(orderId, it.menuId, it.name, it.price, it.qty, it.subtotal);
        }
        stmt.finalize((e)=>{
          if (e) return res.status(500).json({ error: e.message });
          res.status(201).json({ id: orderId, total, items: reserved });
        });
      }
    );
  } catch (e) {
    res.status(409).json({ error: "Order failed", detail: e.response?.data || e.message });
  }
});

router.get("/", authMiddleware, (req, res) => {
  const sql = req.user.role === "admin"
    ? "SELECT * FROM orders ORDER BY created_at DESC"
    : "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";
  const params = req.user.role === "admin" ? [] : [req.user.id];
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get("/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM orders WHERE id = ?", [id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Not found" });
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    db.all("SELECT * FROM order_items WHERE order_id = ?", [id], (e, items) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json({ ...order, items });
    });
  });
});

export default router;
