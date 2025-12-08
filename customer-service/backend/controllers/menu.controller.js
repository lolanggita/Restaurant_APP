import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const PROVIDER_BASE_URL = process.env.PROVIDER_BASE_URL || "http://localhost:4001";

// =========================
// CUSTOMER ACCESS
// =========================
export async function list(req, res) {
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/menus`);
    res.json(data);
  } catch (err) {
    console.error("ERROR list():", err.message);
    res.status(500).json({ error: "Provider unavailable" });
  }
}

export async function get(req, res) {
  const id = req.params.id;
  try {
    const { data } = await axios.get(`${PROVIDER_BASE_URL}/menus/${id}`);
    res.json(data);
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "Menu not found" });
    }
    res.status(500).json({ error: "Provider unavailable" });
  }
}

// =========================
// ADMIN ACCESS — OPTIONAL
// (Jika admin-service terpisah, hapus saja bagian ini)
// =========================

export async function create(req, res) {
  return res.status(403).json({ error: "Admin must use provider-service" });
}

export async function update(req, res) {
  return res.status(403).json({ error: "Admin must use provider-service" });
}

export async function remove(req, res) {
  return res.status(403).json({ error: "Admin must use provider-service" });
}
