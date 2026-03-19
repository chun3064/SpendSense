const { ObjectId } = require("mongodb");
const { getDatabase } = require("../config/db");
const { validateBudget } = require("../utils/validateBudget");

function getCollection() {
  return getDatabase().collection("budgets");
}

function sanitizeBudgetInput(body) {
  return {
    category: String(body.category ?? "").trim(),
    monthlyLimit: Number(body.monthlyLimit),
    month: body.month ? String(body.month) : new Date().getMonth() + 1,
    year: body.year ? Number(body.year) : new Date().getFullYear(),
    createdAt: new Date(),
  };
}

function serializeBudget(budget) {
  return {
    ...budget,
    id: budget._id.toString(),
  };
}

async function getBudgets(req, res) {
  const budgets = await getCollection()
    .find({})
    .sort({ year: -1, month: -1, category: 1 })
    .toArray();

  res.json(budgets.map(serializeBudget));
}

async function createBudget(req, res) {
  const newBudget = sanitizeBudgetInput(req.body);
  const error = validateBudget(newBudget);

  if (error) {
    return res.status(400).json({ error });
  }

  const result = await getCollection().insertOne(newBudget);
  res.status(201).json({
    ...newBudget,
    id: result.insertedId.toString(),
  });
}

async function updateBudget(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid budget id." });
  }

  const updates = sanitizeBudgetInput(req.body);
  const error = validateBudget(updates);

  if (error) {
    return res.status(400).json({ error });
  }

  const result = await getCollection().findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: updates },
    { returnDocument: "after" },
  );

  if (!result) {
    return res.status(404).json({ error: "Budget not found." });
  }

  res.json(serializeBudget(result));
}

async function deleteBudget(req, res) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid budget id." });
  }

  const result = await getCollection().findOneAndDelete({
    _id: new ObjectId(req.params.id),
  });

  if (!result) {
    return res.status(404).json({ error: "Budget not found." });
  }

  res.json({
    message: "Budget deleted.",
    id: req.params.id,
  });
}

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
};
