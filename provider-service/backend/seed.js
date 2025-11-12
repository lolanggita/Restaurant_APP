
import db from "./db.js";

db.serialize(() => {
  db.run("DELETE FROM restaurants");
  db.run("DELETE FROM menus");

  db.run("INSERT INTO restaurants (id, name) VALUES (1, 'Warung Satu Rasa')");

  const menus = [
    ['Nasi Goreng', 18000, 20],
    ['Mie Ayam', 15000, 15],
    ['Sate Ayam (5 tusuk)', 20000, 12],
    ['Ayam Geprek', 22000, 10],
    ['Es Teh Manis', 6000, 50],
    ['Jus Alpukat', 14000, 18],
    ['Bakso', 16000, 14],
    ['Soto Ayam', 17000, 10]
  ];
  const stmt = db.prepare("INSERT INTO menus (restaurant_id, name, price, stock) VALUES (1,?,?,?)");
  for (const [name, price, stock] of menus) stmt.run(name, price, stock);
  stmt.finalize((e)=>{
    if(e) console.error(e);
    else console.log("✅ Seeded: 1 restaurant + menu");
    process.exit(0);
  });
});
