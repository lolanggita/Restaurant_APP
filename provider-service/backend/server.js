import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import db from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


const JWT_SECRET = process.env.JWT_SECRET || "secret_demo_key";

// ===== ADMIN AUTH ROUTES =====
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email & password required" });

    const existing = await new Promise((resolve, reject) =>
      db.get("SELECT * FROM admins WHERE email = ?", [email], (err, row) => err ? reject(err) : resolve(row))
    );
    if (existing) return res.status(409).json({ error: "Email already used" });

    const hashed = await bcrypt.hash(password, 10);

    await new Promise((resolve, reject) =>
      db.run("INSERT INTO admins (name,email,password) VALUES (?,?,?)", [name,email,hashed], function(err){
        if(err) reject(err); else resolve(this.lastID);
      })
    );

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/auth/login", async (req,res) => {
  try {
    const { email, password } = req.body;
    const admin = await new Promise((resolve, reject) =>
      db.get("SELECT * FROM admins WHERE email = ?", [email], (err,row)=> err? reject(err): resolve(row))
    );
    if(!admin) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, admin.password);
    if(!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});


// ============================
// RESTAURANTS
// ============================
app.get("/restaurants", (req, res) => {
  db.all("SELECT id, name FROM restaurants", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/restaurants/:id/menus", (req, res) => {
  const { id } = req.params;
  db.all(
    "SELECT id, name, price, stock FROM menus WHERE restaurant_id = ?",
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});



// ============================
// INTERNAL RESERVE
// ============================
app.post("/internal/reserve", (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items[] required" });
  }

  const details = [];
  let total = 0;

  const check = (i = 0) => {
    if (i >= items.length) return decrement();
    const it = items[i];

    db.get(
      "SELECT id,name,price,stock FROM menus WHERE id = ?",
      [it.menuId],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: `Menu ${it.menuId} not found` });
        if (row.stock < it.qty)
          return res
            .status(409)
            .json({ error: `${row.name} stok kurang (${row.stock} < ${it.qty})` });

        const subtotal = row.price * it.qty;
        total += subtotal;
        details.push({
          menuId: row.id,
          name: row.name,
          price: row.price,
          qty: it.qty,
          subtotal,
        });
        check(i + 1);
      }
    );
  };

  const decrement = () => {
    const stmt = db.prepare("UPDATE menus SET stock = stock - ? WHERE id = ?");
    for (const d of details) stmt.run(d.qty, d.menuId);

    stmt.finalize((e) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json({ items: details, total });
    });
  };

  check();
});

// ============================
// MENU API
// ============================
app.get("/menus", (req, res) => {
  db.all("SELECT id, restaurant_id, name, price, stock FROM menus", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/menus/:id", (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT id, restaurant_id, name, price, stock FROM menus WHERE id = ?",
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Menu not found" });
      res.json(row);
    }
  );
});

// ============================
// LISTEN
// ============================
const PORT = process.env.PORT || 4001;
app.listen(PORT, () =>
  console.log(`✅ Provider-service running at http://localhost:${PORT}`)
);
