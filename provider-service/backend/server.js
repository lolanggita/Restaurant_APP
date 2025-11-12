
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/restaurants", (req, res) => {
  db.all("SELECT id, name FROM restaurants", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/restaurants/:id/menus", (req, res) => {
  const { id } = req.params;
  db.all("SELECT id, name, price, stock FROM menus WHERE restaurant_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/internal/reserve", (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items[] required" });
  }

  // sequential validation & decrement
  const details = [];
  let total = 0;

  const check = (i=0) => {
    if (i >= items.length) return decrement();
    const it = items[i];
    db.get("SELECT id,name,price,stock FROM menus WHERE id = ?", [it.menuId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: `Menu ${it.menuId} not found` });
      if (row.stock < it.qty) return res.status(409).json({ error: `${row.name} stok kurang (${row.stock} < ${it.qty})` });
      const subtotal = row.price * it.qty;
      total += subtotal;
      details.push({ menuId: row.id, name: row.name, price: row.price, qty: it.qty, subtotal });
      check(i+1);
    });
  };

  const decrement = () => {
    const stmt = db.prepare("UPDATE menus SET stock = stock - ? WHERE id = ?");
    for (const d of details) stmt.run(d.qty, d.menuId);
    stmt.finalize((e)=>{
      if (e) return res.status(500).json({ error: e.message });
      res.json({ items: details, total });
    });
  };

  check();
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`✅ Provider-service running at http://localhost:${PORT}`));
