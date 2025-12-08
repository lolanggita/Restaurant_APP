import db from "../db.js";

// CREATE MENU
export const create = (req, res) => {
  const { name, price, description } = req.body;

  db.run(
    `INSERT INTO menu (name, price, description) VALUES (?, ?, ?)`,
    [name, price, description || ""],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      res.status(201).json({ id: this.lastID, message: "menu created" });
    }
  );
};

// LIST ALL MENU
export const list = (req, res) => {
  db.all(`SELECT * FROM menu`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// GET MENU BY ID
export const get = (req, res) => {
  const id = req.params.id;

  db.get(`SELECT * FROM menu WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!row) return res.status(404).json({ message: "menu not found" });

    res.json(row);
  });
};

// UPDATE MENU
export const update = (req, res) => {
  const id = req.params.id;
  const { name, price, description } = req.body;

  db.run(
    `UPDATE menu SET name=?, price=?, description=? WHERE id=?`,
    [name, price, description, id],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0)
        return res.status(404).json({ message: "menu not found" });

      res.json({ message: "menu updated" });
    }
  );
};

// DELETE MENU
export const remove = (req, res) => {
  const id = req.params.id;

  db.run(`DELETE FROM menu WHERE id=?`, [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0)
      return res.status(404).json({ message: "menu not found" });

    res.json({ message: "menu deleted" });
  });
};
