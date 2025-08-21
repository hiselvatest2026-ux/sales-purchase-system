import express from "express";
import morgan from "morgan";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "database.sqlite");
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

// create tables if not exist
db.exec(`
CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  vendor_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(vendor_id) REFERENCES vendors(id)
);
`);

// seed if empty
const vcount = db.prepare("SELECT COUNT(*) as c FROM vendors").get().c;
if (vcount === 0) {
  const insV = db.prepare("INSERT INTO vendors(name, contact) VALUES (?,?)");
  insV.run("Gadget Supplies", "080-777777");
  insV.run("Tech World", "080-888888");
}
const pcount = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
if (pcount === 0) {
  const insP = db.prepare("INSERT INTO products(name,price,vendor_id) VALUES (?,?,?)");
  insP.run("Laptop 14\"", 50000, 1);
  insP.run("Wireless Mouse", 500, 1);
  insP.run("Mechanical Keyboard", 1200, 2);
}

const app = express();
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// APIs
app.get("/api/vendors", (req, res) => {
  const rows = db.prepare("SELECT * FROM vendors ORDER BY id DESC").all();
  res.json(rows);
});

app.post("/api/vendors", (req, res) => {
  const { name, contact } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const info = db.prepare("INSERT INTO vendors(name,contact) VALUES (?,?)").run(name, contact || null);
  const row = db.prepare("SELECT * FROM vendors WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

app.get("/api/products", (req, res) => {
  const rows = db.prepare("SELECT p.*, v.name as vendor_name FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id ORDER BY p.id DESC").all();
  res.json(rows);
});

app.post("/api/products", (req, res) => {
  const { name, price, vendor_id } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const info = db.prepare("INSERT INTO products(name,price,vendor_id) VALUES (?,?,?)").run(name, price || 0, vendor_id || null);
  const row = db.prepare("SELECT p.*, v.name as vendor_name FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ?").get(info.lastInsertRowid);
  res.status(201).json(row);
});

// serve static UI (client build)
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
