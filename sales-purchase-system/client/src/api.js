const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ? import.meta.env.VITE_API_URL : '';

const api = {
  async getProducts() { const res = await fetch(`${BASE}/api/products`); return res.json(); },
  async addProduct(payload) { const res = await fetch(`${BASE}/api/products`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); return res.json(); },

  async getCustomers() { const r = await fetch(`${BASE}/api/customers`); return r.json(); },
  async addCustomer(p) { const r = await fetch(`${BASE}/api/customers`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); return r.json(); },

  async getVendors() { const r = await fetch(`${BASE}/api/vendors`); return r.json(); },
  async addVendor(p) { const r = await fetch(`${BASE}/api/vendors`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}); return r.json(); },

  async createSale(payload) { const r = await fetch(`${BASE}/api/sales`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); return r.json(); },
  async getSale(id) { const r = await fetch(`${BASE}/api/sales/${id}`); return r.json(); },
  async listSales() { const r = await fetch(`${BASE}/api/sales`); return r.json(); },

  async createPurchase(payload) { const r = await fetch(`${BASE}/api/purchases`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); return r.json(); },
  async listPurchases() { const r = await fetch(`${BASE}/api/purchases`); return r.json(); },
};
export default api;
