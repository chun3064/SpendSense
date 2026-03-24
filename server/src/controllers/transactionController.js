const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");
const { validateTransaction } = require("../utils/validateTransaction");

// Get the transactions collection from MongoDB
function getCollection() {
  return getDatabase().collection("transactions");
}

// Clean up incoming transaction data before saving
function sanitizeTransactionInput(body) {
  return {
    title: String(body.title ?? "").trim(),
    category: String(body.category ?? "").trim(),
    type: String(body.type ?? "").trim(),
    amount: Number(body.amount),
    date: body.date ? String(body.date) : new Date().toISOString().slice(0, 10),
    isRecurring: Boolean(body.isRecurring),
    createdAt: new Date(),
  };
}

// Convert MongoDB _id into a simpler id field for the client
function serializeTransaction(transaction) {
  return {
    ...transaction,
    id: transaction._id.toString(),
  };
}

// Get all saved transactions
async function getTransactions(req, res) {
  const transactions = await getCollection()
    .find({})
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  res.json(transactions.map(serializeTransaction));
}

// Create a new transaction
async function createTransaction(req, res) {
  const newTransaction = sanitizeTransactionInput(req.body);
  const error = validateTransaction(newTransaction);

  if (error) {
    return res.status(400).json({ error });
  }

  const result = await getCollection().insertOne(newTransaction);
  res.status(201).json({
    ...newTransaction,
    id: result.insertedId.toString(),
  });
}

// Update one transaction by id
async function updateTransaction(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid transaction id." });
  }

  const updates = sanitizeTransactionInput(req.body);
  const error = validateTransaction(updates);

  if (error) {
    return res.status(400).json({ error });
  }

  const result = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: updates },
    { returnDocument: "after" },
  );

  if (!result) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  res.json(serializeTransaction(result));
}

// Delete one transaction by id
async function deleteTransaction(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid transaction id." });
  }

  const result = await getCollection().findOneAndDelete({
    _id: new ObjectId(req.params.id),
  });

  if (!result) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  res.json({
    message: "Transaction deleted.",
    id: req.params.id,
  });
}

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
