import express from "express";
import db from "../db.js";
import axios from "axios";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || "http://localhost:4001";

// Helper: Reserve stock from provider
const reserveStock = async (items) => {
  const { data } = await axios.post(`${PROVIDER_BASE_URL}/internal/reserve`, { items });
  return {
    reserved: data.items || [],
    total: data.total || data.items.reduce((sum, i) => sum + i.subtotal, 0)
  };
};

// POST /api/orders → For logged-in customers only
router.post("/", authenticate, async (req, res) => {
  if (req.user.role !== "customer" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Only customers and admins can place orders" });
  }

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "items[] is required and must not be empty" });
    }

    const { reserved, total } = await reserveStock(items);

    // Insert order
    db.run(
      `INSERT INTO orders (customer_name, user_id, total, created_at) 
        VALUES (?, ?, ?, datetime('now'))`,
      [req.user.name || "Customer", req.user.id, total],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const orderId = this.lastID;

        // Insert order items
        const stmt = db.prepare(
          `INSERT INTO order_items (order_id, menu_id, name, price, qty, subtotal) 
            VALUES (?, ?, ?, ?, ?, ?)`
        );

        for (const item of reserved) {
          stmt.run(orderId, item.menuId, item.name, item.price, item.qty, item.subtotal);
        }

        stmt.finalize(async (err) => {
          if (err) return res.status(500).json({ error: err.message });

          // Insert delivery record
          db.run(
            `INSERT INTO deliveries (order_id, status, eta) VALUES (?, ?, ?)`,
            [orderId, "Dikemas", new Date(Date.now() + 30*60*1000).toISOString()], // +30 minutes
            (err) => {
              if (err) return res.status(500).json({ error: err.message });

              res.status(201).json({
                message: "Order placed successfully",
                orderId,
                total,
                items: reserved,
                status: "Dikemas",
                estimatedDelivery: new Date(Date.now() + 30*60*1000).toISOString()
              });
            }
          );
        });
      }
    );
  } catch (err) {
    console.error("Order failed:", err.response?.data || err.message);
    const status = err.response?.status || 500;
    const message = err.response?.data?.error || "Failed to place order";
    res.status(status).json({ error: message });
  }
});

// POST /api/orders/admin → Only admin can use (can place order for anyone)
router.post("/admin", authenticate, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  const { items, userId, customerName } = req.body;

  if (!userId || !customerName) {
    return res.status(400).json({ error: "userId and customerName required for admin order" });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items[] required" });
  }

  try {
    const { reserved, total } = await reserveStock(items);

    db.run(
      `INSERT INTO orders (customer_name, user_id, total, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [customerName, userId, total],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const orderId = this.lastID;

        const stmt = db.prepare(
          `INSERT INTO order_items (order_id, menu_id, name, price, qty, subtotal) VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const item of reserved) {
          stmt.run(orderId, item.menuId, item.name, item.price, item.qty, item.subtotal);
        }

        stmt.finalize((err) => {
          if (err) return res.status(500).json({ error: err.message });

          db.run(
            `INSERT INTO deliveries (order_id, status, eta) VALUES (?, ?, ?)`,
            [orderId, "Dikemas", new Date(Date.now() + 30*60*1000).toISOString()],
            () => {
              res.status(201).json({
                message: "Admin order created",
                orderId,
                forUserId: userId,
                customerName,
                total,
                items: reserved
              });
            }
          );
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.error || "Reserve failed" });
  }
});

// GET /api/orders → Customer sees own, Admin sees all
router.get("/", authenticate, (req, res) => {
  const sql = req.user.role === "admin"
    ? `SELECT * FROM orders ORDER BY created_at DESC`
    : `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`;

  const params = req.user.role === "admin" ? [] : [req.user.id];

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/orders/:id → With proper access control
router.get("/:id", authenticate, (req, res) => {
  const orderId = req.params.id;

  db.get(`SELECT * FROM orders WHERE id = ?`, [orderId], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Admin can see all, customer only own
    if (req.user.role !== "admin" && order.user_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.all(`SELECT * FROM order_items WHERE order_id = ?`, [orderId], (err, items) => {
      if (err) return res.status(500).json({ error: err.message });

      db.get(`SELECT * FROM deliveries WHERE order_id = ? ORDER BY id DESC LIMIT 1`, [orderId], (err, delivery) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ...order, items, delivery: delivery || null });
      });
    });
  });
});

export default router;