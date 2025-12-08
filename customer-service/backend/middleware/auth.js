import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Middleware untuk cek token
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email, role, ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Khusus Admin
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// Khusus Customer
export function customerOnly(req, res, next) {
  if (req.user?.role !== "customer") {
    return res.status(403).json({ error: "Customer only" });
  }
  next();
}
