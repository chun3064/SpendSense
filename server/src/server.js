const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectToDatabase } = require("./config/db");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SpendSense API is running",
  });
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Something went wrong on the server.",
  });
});

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
