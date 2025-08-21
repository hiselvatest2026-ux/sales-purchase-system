import express from "express";
import morgan from "morgan";
import pkg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pkg;

const app = express();
app.use(morgan("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow CORS for simple testing (if frontend is served from same origin it's fine)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Postgres connection via DATABASE_URL
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/salesdb';
const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
});

async function initDb() {
  // create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price NUMERIC NOT NULL DEFAULT 0,
      vendor_id INTEGER REFERENCES vendors(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // seed vendors if empty
  const vres = await pool.query("SELECT COUNT(*) FROM vendors");
  if (parseInt(vres.rows[0].count) === 0) {
    await pool.query("INSERT INTO vendors (name, contact) VALUES ($1,$2)", ["Gadget Supplies","080-777777"]);
    await pool.query("INSERT INTO vendors (name, contact) VALUES ($1,$2)", ["Tech World","080-888888"]);
  }

  // seed products if empty
  const pres = await pool.query("SELECT COUNT(*) FROM products");
  if (parseInt(pres.rows[0].count) === 0) {
    await pool.query("INSERT INTO products (name, price, vendor_id) VALUES ($1,$2,$3)", ["Laptop 14\"", 50000, 1]);
    await pool.query("INSERT INTO products (name, price, vendor_id) VALUES ($1,$2,$3)", ["Wireless Mouse", 500, 1]);
    await pool.query("INSERT INTO products (name, price, vendor_id) VALUES ($1,$2,$3)", ["Mechanical Keyboard", 1200, 2]);
  }
}

initDb().catch(err => {
  console.error("DB init error", err);
  process.exit(1);
});

// APIs

app.get("/api/vendors", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM vendors ORDER BY id DESC");
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/vendors", async (req, res) => {
  try {
    const { name, contact } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    const info = await pool.query("INSERT INTO vendors (name, contact) VALUES ($1,$2) RETURNING *", [name, contact || null]);
    res.status(201).json(info.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db error" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const r = await pool.query("SELECT p.*, v.name as vendor_name FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id ORDER BY p.id DESC");
    res.json(r.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db error" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, price, vendor_id } = req.body;
    if (!name) return res.status(400).json({ error: "name required" });
    // optionally validate vendor exists
    let vid = vendor_id || null;
    if (vid) {
      const v = await pool.query("SELECT id FROM vendors WHERE id=$1", [vid]);
      if (v.rows.length === 0) return res.status(400).json({ error: "vendor not found" });
    }
    const info = await pool.query("INSERT INTO products (name, price, vendor_id) VALUES ($1,$2,$3) RETURNING p.id, p.name, p.price, p.vendor_id, v.name as vendor_name FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = (SELECT MAX(id) FROM products)"); 
    // Fallback simpler insert and select
    const inserted = await pool.query("INSERT INTO products (name, price, vendor_id) VALUES ($1,$2,$3) RETURNING *", [name, price || 0, vid]);
    const out = await pool.query("SELECT p.*, v.name as vendor_name FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = $1", [inserted.rows[0].id]);
    res.status(201).json(out.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "db error" });
  }
});

// Serve static client build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
