
import db from "./db.js";
import bcrypt from "bcryptjs";

const run = async () => {
  const hash = await bcrypt.hash("123456", 10);
  db.run(
    "INSERT OR IGNORE INTO users(name,email,password,role) VALUES(?,?,?,?)",
    ["Admin", "admin@food.com", hash, "admin"],
    (err) => {
      if (err) console.error(err.message);
      else console.log("✅ Admin default dibuat: admin@food.com / 123456");
      process.exit(0);
    }
  );
};

run();
