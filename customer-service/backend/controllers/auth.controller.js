import db from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "secret_demo_key";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "email & password required" });

    // check existing user
    const user = await new Promise((resolve, reject) =>
      db.get(
        "SELECT * FROM customers WHERE email = ?",
        [email],
        (err, row) => (err ? reject(err) : resolve(row))
      )
    );
    if (user) return res.status(409).json({ message: "email already used" });

    const hashed = await bcrypt.hash(password, 10);

    await new Promise((resolve, reject) =>
      db.run(
        "INSERT INTO customers (name, email, password) VALUES (?, ?, ?)",
        [name || "", email, hashed],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      )
    );

    res.status(201).json({ message: "registered" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await new Promise((resolve, reject) =>
      db.get(
        "SELECT id, name, email, password FROM customers WHERE email = ?",
        [email],
        (err, row) => (err ? reject(err) : resolve(row))
      )
    );

    if (!user) return res.status(401).json({ message: "invalid creds" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "invalid creds" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: "customer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "server error" });
  }
};

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "no token" });

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: "invalid token" });
  }
};
