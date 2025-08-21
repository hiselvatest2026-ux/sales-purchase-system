import { useEffect, useState } from 'react';

export default function LineItemRow({ products, value, onChange, onRemove }) {
  const [productId, setProductId] = useState(value.product_id || '');
  const selected = products.find(p => p.id === Number(productId));

  useEffect(() => {
    if (selected && !value.price) handleChange('price', selected.price);
    // eslint-disable-next-line
  }, [productId]);

  function handleChange(key, v) {
    const obj = { ...value, [key]: key === 'product_id' ? Number(v) : Number(v) };
    onChange(obj);
  }

  return (
    <tr>
      <td>
        <select className="input" value={productId} onChange={e => { setProductId(e.target.value); onChange({ ...value, product_id: Number(e.target.value) }); }}>
          <option value="">Select</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>
      </td>
      <td><input className="input" type="number" min="1" value={value.qty || 1} onChange={e => handleChange('qty', e.target.value)} /></td>
      <td><input className="input" type="number" step="0.01" value={value.price || selected?.price || 0} onChange={e => handleChange('price', e.target.value)} /></td>
      <td><input className="input" type="number" step="0.01" value={value.discount_pct || 0} onChange={e => handleChange('discount_pct', e.target.value)} /></td>
      <td><input className="input" type="number" step="0.01" value={value.tax_pct || 0} onChange={e => handleChange('tax_pct', e.target.value)} /></td>
      <td className="no-print">
        <button className="btn secondary" onClick={onRemove}>Remove</button>
      </td>
    </tr>
  );
}
