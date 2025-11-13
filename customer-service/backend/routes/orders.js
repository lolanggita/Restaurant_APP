import express from "express";
import db from "../db.js";
import axios from "axios";
import dotenv from "dotenv";
import { authMiddleware } from "../middleware/auth.js";

dotenv.config();
const router = express.Router();
const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || "http://localhost:4001";

// --- POST order ---
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items[] required" });
    }

    // reserve items di provider
    const { data } = await axios.post(`${PROVIDER_BASE_URL}/internal/reserve`, { items });
    const reserved = data.reserved || data.items || [];
    const total = data.total || reserved.reduce((a, b) => a + (b.subtotal || 0), 0);

    // insert order
    db.run(
      "INSERT INTO orders(customer_name,user_id,total,created_at) VALUES (?,?,?,datetime('now'))",
      [req.user.name || "Customer", req.user.id, total],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const orderId = this.lastID;

        // insert order items
        const stmt = db.prepare("INSERT INTO order_items(order_id,menu_id,name,price,qty,subtotal) VALUES(?,?,?,?,?,?)");
        for (const it of reserved) {
          stmt.run(orderId, it.menuId, it.name, it.price, it.qty, it.subtotal);
        }
        stmt.finalize((e) => {
          if (e) return res.status(500).json({ error: e.message });

          // insert delivery otomatis dengan status awal "Dikemas"
          db.run(
            "INSERT INTO deliveries(order_id,status,eta) VALUES (?,?,?)",
            [orderId, "Dikemas", new Date().toISOString()],
            (err2) => {
              if (err2) return res.status(500).json({ error: err2.message });

              res.status(201).json({
                id: orderId,
                total,
                items: reserved,
                delivery: { status: "Dikemas", eta: new Date().toISOString() },
              });
            }
          );
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- GET all orders ---
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

// --- GET order by ID (include items + latest delivery) ---
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

      // Ambil delivery terbaru
      db.get("SELECT * FROM deliveries WHERE order_id = ? ORDER BY id DESC LIMIT 1", [id], (err2, delivery) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ...order, items, delivery });
      });
    });
  });
});

export default router;
