
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email & password required" });
    const hashed = await bcrypt.hash(password, 10);
    const roleFinal = role === "admin" ? "admin" : "customer";
    db.run(
      "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
      [name || null, email, hashed, roleFinal],
      function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ id: this.lastID, email, role: roleFinal });
      }
    );
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err || !user) return res.status(400).json({ error: "User not found" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Wrong password" });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

router.get("/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    res.json(payload);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});



export default router;
