import db from "../db.js";
import bcrypt from "bcryptjs";

export const me = (req, res) => {
  db.get(
    "SELECT id, name, email, role, phone, address FROM users WHERE id=?",
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(row);
    }
  );
};

export const updateMe = (req, res) => {
  const { name, phone, address } = req.body;

  db.run(
    "UPDATE users SET name=?, phone=?, address=? WHERE id=?",
    [name, phone, address, req.user.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
};

export const deleteMe = (req, res) => {
  db.run("DELETE FROM users WHERE id=?", [req.user.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
};
