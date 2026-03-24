const express = require("express");
const cors = require("cors");

const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN;

// Middleware setup
app.use(
  cors({
    origin: allowedOrigin || true,
  })
);
app.use(express.json());

// Base route for quick API check
app.get("/", (req, res) => {
  res.json({
    message: "SpendSense API is running",
  });
});

app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);

// Basic server error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Something went wrong on the server.",
  });
});

module.exports = app;
