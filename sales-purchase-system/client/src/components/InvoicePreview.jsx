import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function InvoicePreview({ sale, items, customer, onClose }) {
  async function downloadPdf() {
    const node = document.getElementById('invoice-paper');
    const canvas = await html2canvas(node, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgWidth = pageWidth;
    const imgHeight = canvas.height * imgWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`${sale.invoice_no}.pdf`);
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="no-print" style={{ display:'flex', gap: 8, justifyContent:'flex-end' }}>
        <button className="btn secondary" onClick={() => window.print()}>Print</button>
        <button className="btn" onClick={downloadPdf}>Download PDF</button>
        <button className="btn secondary" onClick={onClose}>Close</button>
      </div>

      <div id="invoice-paper" className="invoice-paper">
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Your Company</h2>
            <div>Address line 1</div>
            <div>GSTIN: 12ABCDE3456F7Z8</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="badge">Invoice</div>
            <div><strong>No:</strong> {sale.invoice_no}</div>
            <div><strong>Date:</strong> {new Date(sale.created_at).toLocaleString()}</div>
          </div>
        </div>
        <hr/>
        <div style={{ display:'flex', justifyContent:'space-between', margin:'10px 0' }}>
          <div>
            <strong>Bill To</strong>
            <div>{customer?.name || 'Walk-in Customer'}</div>
            {customer?.phone && <div>{customer.phone}</div>}
            {customer?.address && <div>{customer.address}</div>}
          </div>
          <div style={{ textAlign:'right' }}>
            <div><strong>Sub Total:</strong> ₹{sale.sub_total.toFixed(2)}</div>
            <div><strong>Discount:</strong> ₹{sale.discount_total.toFixed(2)}</div>
            <div><strong>Tax:</strong> ₹{sale.tax_total.toFixed(2)}</div>
            <div style={{ fontSize: 20, marginTop: 6 }}><strong>Grand Total:</strong> ₹{sale.grand_total.toFixed(2)}</div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width:'40%' }}>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Disc %</th>
              <th>Tax %</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.name} <span style={{ color:'#666' }}>({it.sku})</span></td>
                <td>{it.qty}</td>
                <td>₹{it.price.toFixed(2)}</td>
                <td>{it.discount_pct}%</td>
                <td>{it.tax_pct}%</td>
                <td>₹{it.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 20 }}>
          <em>Thank you for your business!</em>
        </div>
      </div>
    </div>
  );
}
