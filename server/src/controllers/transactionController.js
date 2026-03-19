const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");
const { validateTransaction } = require("../utils/validateTransaction");

function getCollection() {
  return getDatabase().collection("transactions");
}

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

function serializeTransaction(transaction) {
  return {
    ...transaction,
    id: transaction._id.toString(),
  };
}

async function getTransactions(req, res) {
  const transactions = await getCollection()
    .find({})
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  res.json(transactions.map(serializeTransaction));
}

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
