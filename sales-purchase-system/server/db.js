import Database from 'better-sqlite3';
import fs from 'fs';

const DB_FILE = './data.sqlite';
const firstRun = !fs.existsSync(DB_FILE);
const db = new Database(DB_FILE);

db.pragma('journal_mode = WAL');

export function init() {
  if (firstRun) {
    const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url));
    db.exec(schema.toString());
    seed();
  }
}

function seed() {
  const now = new Date().toISOString();
  const addProd = db.prepare(`INSERT INTO products(name, sku, price, stock_qty) VALUES (?,?,?,?)`);
  addProd.run('Laptop 14"', 'LAP-14', 50000, 10);
  addProd.run('Wireless Mouse', 'MOU-001', 500, 50);
  addProd.run('Keyboard', 'KEY-101', 1200, 20);

  const addCust = db.prepare(`INSERT INTO customers(name, phone, address) VALUES (?,?,?)`);
  addCust.run('John Doe', '9999999999', 'Bangalore');
  addCust.run('Acme Corp', '080-123456', 'Chennai');

  const addVendor = db.prepare(`INSERT INTO vendors(name, phone, address) VALUES (?,?,?)`);
  addVendor.run('Gadget Supplies', '080-777777', 'Mumbai');

  console.log(`[DB] Seeded sample data at ${now}`);
}

export default db;
