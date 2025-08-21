import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import db, { init } from './db.js';

init();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helpers
function calcTotals(items) {
  let sub = 0, tax = 0, disc = 0;
  for (const it of items) {
    const base = it.price * it.qty;
    const d = (base * (it.discount_pct || 0)) / 100;
    const taxable = base - d;
    const t = (taxable * (it.tax_pct || 0)) / 100;
    const line_total = taxable + t;
    sub += base;
    disc += d;
    tax += t;
    it.line_total = Number(line_total.toFixed(2));
  }
  return {
    sub_total: Number(sub.toFixed(2)),
    discount_total: Number(disc.toFixed(2)),
    tax_total: Number(tax.toFixed(2)),
    grand_total: Number((sub - disc + tax).toFixed(2))
  };
}

// Products
app.get('/api/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  res.json(rows);
});

app.post('/api/products', (req, res) => {
  const { name, sku, price, stock_qty } = req.body;
  const stmt = db.prepare('INSERT INTO products(name, sku, price, stock_qty) VALUES (?,?,?,?)');
  const info = stmt.run(name, sku, price, stock_qty ?? 0);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Customers & Vendors
app.get('/api/customers', (req, res) => {
  res.json(db.prepare('SELECT * FROM customers ORDER BY id DESC').all());
});
app.post('/api/customers', (req, res) => {
  const { name, phone, address } = req.body;
  const info = db.prepare('INSERT INTO customers(name, phone, address) VALUES (?,?,?)').run(name, phone, address);
  res.status(201).json({ id: info.lastInsertRowid });
});

app.get('/api/vendors', (req, res) => {
  res.json(db.prepare('SELECT * FROM vendors ORDER BY id DESC').all());
});
app.post('/api/vendors', (req, res) => {
  const { name, phone, address } = req.body;
  const info = db.prepare('INSERT INTO vendors(name, phone, address) VALUES (?,?,?)').run(name, phone, address);
  res.status(201).json({ id: info.lastInsertRowid });
});

// Create Sale
app.post('/api/sales', (req, res) => {
  const { customer_id, items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'No items' });

  const totals = calcTotals(items);
  const tx = db.transaction(() => {
    const invoice_no = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO sales_orders(invoice_no, customer_id, created_at, sub_total, tax_total, discount_total, grand_total)
      VALUES (?,?,?,?,?,?,?)`).run(invoice_no, customer_id ?? null, now, totals.sub_total, totals.tax_total, totals.discount_total, totals.grand_total);

    const addItem = db.prepare(`INSERT INTO sales_items(order_id, product_id, qty, price, discount_pct, tax_pct, line_total)
      VALUES (?,?,?,?,?,?,?)`);
    const decStock = db.prepare('UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?');

    for (const it of items) {
      addItem.run(info.lastInsertRowid, it.product_id, it.qty, it.price, it.discount_pct || 0, it.tax_pct || 0, it.line_total);
      decStock.run(it.qty, it.product_id);
    }

    return { id: info.lastInsertRowid, invoice_no, ...totals, created_at: now };
  });

  try {
    const result = tx();
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

// Get Sale + Items
app.get('/api/sales/:id', (req, res) => {
  const id = Number(req.params.id);
  const order = db.prepare('SELECT * FROM sales_orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  const items = db.prepare(`SELECT si.*, p.name, p.sku FROM sales_items si JOIN products p ON p.id = si.product_id WHERE order_id = ?`).all(id);
  const customer = order.customer_id ? db.prepare('SELECT * FROM customers WHERE id = ?').get(order.customer_id) : null;
  res.json({ order, items, customer });
});

app.get('/api/sales', (req, res) => {
  const rows = db.prepare('SELECT * FROM sales_orders ORDER BY id DESC').all();
  res.json(rows);
});

// Create Purchase
app.post('/api/purchases', (req, res) => {
  const { vendor_id, items } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'No items' });
  const totals = calcTotals(items);

  const tx = db.transaction(() => {
    const bill_no = `PUR-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();
    const info = db.prepare(`INSERT INTO purchase_orders(bill_no, vendor_id, created_at, sub_total, tax_total, discount_total, grand_total)
      VALUES (?,?,?,?,?,?,?)`).run(bill_no, vendor_id ?? null, now, totals.sub_total, totals.tax_total, totals.discount_total, totals.grand_total);

    const addItem = db.prepare(`INSERT INTO purchase_items(order_id, product_id, qty, price, discount_pct, tax_pct, line_total)
      VALUES (?,?,?,?,?,?,?)`);
    const incStock = db.prepare('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?');

    for (const it of items) {
      addItem.run(info.lastInsertRowid, it.product_id, it.qty, it.price, it.discount_pct || 0, it.tax_pct || 0, it.line_total);
      incStock.run(it.qty, it.product_id);
    }

    return { id: info.lastInsertRowid, bill_no, ...totals, created_at: now };
  });

  try {
    const result = tx();
    res.status(201).json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
});

app.get('/api/purchases', (req, res) => {
  const rows = db.prepare('SELECT * FROM purchase_orders ORDER BY id DESC').all();
  res.json(rows);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
