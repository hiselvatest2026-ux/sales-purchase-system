# Sales & Purchase System (Node + React)

A minimal full‑stack app with printable invoices (browser print + PDF export).

## Quick Start (Local)

### 1) Backend (Node + Express + SQLite)
```bash
cd server
npm install
npm run dev
# API at http://localhost:4000
```

### 2) Frontend (React + Vite)
```bash
cd ../client
npm install
npm run dev
# UI at http://localhost:5173 (proxy to API)
```

On first run, the DB is auto‑created and seeded with sample products/customers/vendors.

## Deploy on Render

- Create **Web Service** for `/server` (Node 18)  
  - Build: `npm install`
  - Start: `node server.js`
- Create **Static Site** for `/client`  
  - Build: `npm install && npm run build`
  - Publish: `dist`
- Add env in client: `VITE_API_URL=https://<your-backend>.onrender.com`

## Features
- Create sales orders, per-line discount & tax, totals.
- Inventory updates (dec on sale, inc on purchase).
- List sales orders and open any invoice.
- Browser print and **Download PDF**.
- Simple products & customers CRUD (create & list).

## Customize
- Company details/GST: edit `client/src/components/InvoicePreview.jsx` header.
- Invoice numbering: generated in `server/server.js` as `INV-YYYYMMDD-<id>`.
- Thermal receipt: add a receipt layout & print CSS (`@page { size: 80mm auto; }`).

## License
MIT
