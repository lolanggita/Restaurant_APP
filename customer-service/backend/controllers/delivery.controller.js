// controllers/delivery.controller.js
import db from '../db.js'; // pastikan path sesuai

// Buat pengiriman baru (admin)
// Buat pengiriman baru (admin)
export const createDelivery = (req, res) => {
  const { order_id, status } = req.body;
  const user = req.user;

  // Hanya admin yang bisa create
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: hanya admin yang bisa membuat delivery" });
  }

  // order_id wajib
  if (!order_id) {
    return res.status(400).json({ error: "order_id wajib diisi" });
  }

  // cek apakah order ada
  db.get("SELECT * FROM orders WHERE id = ?", [order_id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });

    // validasi status
    const validStatus = ["Belum Dikirim", "Dikemas", "Dikirim", "Dalam Perjalanan", "Selesai", "Dibatalkan"];
    const deliveryStatus = validStatus.includes(status) ? status : "Belum Dikirim";

    // insert delivery
    db.run(
      `INSERT INTO deliveries (order_id, status, eta) VALUES (?, ?, ?)`,
      [order_id, deliveryStatus, new Date().toISOString()],
      function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });

        res.status(201).json({
          id: this.lastID,
          order_id,
          status: deliveryStatus,
          eta: new Date().toISOString()
        });
      }
    );
  });
};


// Tampilkan semua pengiriman (admin)
export const listDeliveries = (req, res) => {
  db.all(`SELECT * FROM deliveries`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Tampilkan pengiriman berdasarkan ID
export const getDelivery = (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM deliveries WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Delivery not found' });
    res.json(row);
  });
};
export const updateDelivery = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;

  // Hanya admin yang bisa update
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: hanya admin yang bisa update status" });
  }

  // Validasi status
  const validStatus = ["Belum Dikirim", "Dikemas", "Dikirim", "Dalam Perjalanan", "Selesai", "Dibatalkan"];
  if (!validStatus.includes(status)) {
    return res.status(400).json({ error: "Status tidak valid" });
  }

  db.run(
    `UPDATE deliveries SET status = ? WHERE id = ?`,
    [status, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "Delivery not found" });
      res.json({ message: "Status berhasil diperbarui", id, status });
    }
  );
};


// List pengiriman berdasarkan order (customer)
export const listByOrder = (req, res) => {
  const { orderId } = req.params;
  db.all(
    `SELECT * FROM deliveries WHERE order_id = ?`,
    [orderId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
};
