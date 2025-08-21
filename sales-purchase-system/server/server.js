import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "morgan";
const morgan = pkg;

const app = express();
app.use(morgan("dev"));

app.get("/", (req, res) => res.send("Sales Purchase System API is running"));

app.listen(5000, () => console.log("Server started on port 5000"));
