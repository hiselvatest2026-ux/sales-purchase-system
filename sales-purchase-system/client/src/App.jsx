import React, { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [sales, setSales] = useState([]);
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    axios.get("/api/sales").then(res => setSales(res.data));
  }, []);

  const addSale = async () => {
    const newSale = { item, quantity, price };
    const res = await axios.post("/api/sales", newSale);
    setSales([...sales, res.data]);
    setItem(""); setQuantity(""); setPrice("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Sales & Purchase System</h1>
      <div>
        <input placeholder="Item" value={item} onChange={e => setItem(e.target.value)} />
        <input placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} />
        <input placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} />
        <button onClick={addSale}>Add Sale</button>
      </div>
      <h2>Sales Records</h2>
      <ul>
        {sales.map((s, idx) => (
          <li key={idx}>{s.item} - {s.quantity} pcs @ {s.price} each</li>
        ))}
      </ul>
    </div>
  );
}
