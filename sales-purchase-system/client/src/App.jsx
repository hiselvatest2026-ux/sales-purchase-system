import { useEffect, useMemo, useState } from 'react';
import api from './api';
import LineItemRow from './components/LineItemRow';
import InvoicePreview from './components/InvoicePreview';

export default function App() {
  const [tab, setTab] = useState('sales');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [saleItems, setSaleItems] = useState([{ qty: 1 }]);
  const [customerId, setCustomerId] = useState('');

  const [invoiceData, setInvoiceData] = useState(null);

  const [newProduct, setNewProduct] = useState({ name:'', sku:'', price:0, stock_qty:0 });

  useEffect(() => { (async () => {
    setProducts(await api.getProducts());
    setCustomers(await api.getCustomers());
    setVendors(await api.getVendors());
  })(); }, []);

  const totals = useMemo(() => {
    let sub=0, disc=0, tax=0;
    for (const it of saleItems) {
      if (!it.product_id || !it.qty || !it.price) continue;
      const base = it.price * it.qty;
      const d = base * (Number(it.discount_pct||0)/100);
      const taxable = base - d;
      const t = taxable * (Number(it.tax_pct||0)/100);
      sub += base; disc += d; tax += t;
    }
    return { sub, disc, tax, grand: sub - disc + tax };
  }, [saleItems]);

  function updateItem(idx, val) {
    setSaleItems(items => items.map((it, i) => i===idx ? val : it));
  }
  function removeItem(idx) { setSaleItems(items => items.filter((_, i) => i!==idx)); }

  async function submitSale() {
    const payload = {
      customer_id: customerId ? Number(customerId) : null,
      items: saleItems.filter(it => it.product_id && it.qty && it.price)
    };
    const created = await api.createSale(payload);
    const full = await api.getSale(created.id);
    setInvoiceData(full);
    setProducts(await api.getProducts()); // refresh stocks
  }

  async function addProduct() {
    await api.addProduct(newProduct);
    setNewProduct({ name:'', sku:'', price:0, stock_qty:0 });
    setProducts(await api.getProducts());
  }

  return (
    <>
      <header>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h1 style={{ margin:0 }}>Sales & Purchase</h1>
          <nav className="no-print" style={{ display:'flex', gap:12 }}>
            <button className="btn secondary" onClick={() => setTab('sales')}>New Sale</button>
            <button className="btn secondary" onClick={() => setTab('products')}>Products</button>
            <button className="btn secondary" onClick={() => setTab('orders')}>Sales Orders</button>
          </nav>
        </div>
      </header>

      <div className="container">
        {tab === 'sales' && (
          <div className="card">
            <h2>Create Sale</h2>
            <div className="row" style={{ marginBottom: 12 }}>
              <div style={{ gridColumn: 'span 6' }}>
                <label>Customer</label>
                <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Walk-in</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="no-print" style={{ gridColumn: 'span 6', textAlign:'right', alignSelf:'end' }}>
                <button className="btn" onClick={() => setSaleItems(items => [...items, { qty: 1 }])}>+ Add Item</button>
              </div>
            </div>

            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Disc %</th>
                  <th>Tax %</th>
                  <th className="no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((it, idx) => (
                  <LineItemRow key={idx} products={products} value={it} onChange={v => updateItem(idx, v)} onRemove={() => removeItem(idx)} />
                ))}
              </tbody>
            </table>

            <div style={{ display:'flex', justifyContent:'flex-end', gap: 20, marginTop: 12 }}>
              <div><strong>Sub Total:</strong> ₹{totals.sub.toFixed(2)}</div>
              <div><strong>Discount:</strong> ₹{totals.disc.toFixed(2)}</div>
              <div><strong>Tax:</strong> ₹{totals.tax.toFixed(2)}</div>
              <div style={{ fontSize: 18 }}><strong>Grand:</strong> ₹{totals.grand.toFixed(2)}</div>
            </div>

            <div className="no-print" style={{ marginTop: 12, textAlign:'right' }}>
              <button className="btn" onClick={submitSale}>Save & Preview Invoice</button>
            </div>

            {invoiceData && (
              <InvoicePreview sale={invoiceData.order} items={invoiceData.items} customer={invoiceData.customer} onClose={() => setInvoiceData(null)} />
            )}
          </div>
        )}

        {tab === 'products' && (
          <div className="card">
            <h2>Products</h2>
            <div className="row" style={{ marginBottom: 12 }}>
              <div style={{ gridColumn:'span 3' }}><input className="input" placeholder="Name" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} /></div>
              <div style={{ gridColumn:'span 3' }}><input className="input" placeholder="SKU" value={newProduct.sku} onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })} /></div>
              <div style={{ gridColumn:'span 3' }}><input className="input" type="number" placeholder="Price" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })} /></div>
              <div style={{ gridColumn:'span 3' }}><input className="input" type="number" placeholder="Stock" value={newProduct.stock_qty} onChange={e => setNewProduct({ ...newProduct, stock_qty: Number(e.target.value) })} /></div>
            </div>
            <div className="no-print" style={{ textAlign:'right' }}>
              <button className="btn" onClick={addProduct}>Add Product</button>
            </div>

            <table className="table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>Name</th><th>SKU</th><th>Price</th><th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>₹{p.price.toFixed(2)}</td>
                    <td><span className="badge">{p.stock_qty}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'orders' && (
          <OrdersList />
        )}
      </div>
    </>
  );
}

function OrdersList() {
  const [sales, setSales] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => { (async () => setSales(await api.listSales()))(); }, []);

  async function open(id) {
    setSelected(await api.getSale(id));
  }

  return (
    <div className="card">
      <h2>Sales Orders</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Invoice No</th><th>Date</th><th>Grand Total</th><th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map(o => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.invoice_no}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>₹{o.grand_total.toFixed(2)}</td>
              <td><button className="btn secondary" onClick={() => open(o.id)}>Open</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <InvoicePreview sale={selected.order} items={selected.items} customer={selected.customer} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
