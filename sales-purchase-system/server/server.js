import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/salesdb")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Simple schema
const SaleSchema = new mongoose.Schema({
  item: String,
  quantity: Number,
  price: Number,
  date: { type: Date, default: Date.now }
});
const Sale = mongoose.model("Sale", SaleSchema);

// Routes
app.get("/api/sales", async (req, res) => {
  const sales = await Sale.find();
  res.json(sales);
});

app.post("/api/sales", async (req, res) => {
  const sale = new Sale(req.body);
  await sale.save();
  res.json(sale);
});

// Root route (to avoid "Cannot GET /")
app.get("/", (req, res) => {
  res.send("Sales & Purchase System API is running 🚀");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
