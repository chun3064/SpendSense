import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateBudgetStatus,
  calculateTotals,
  filterByCategory,
} from "../../client/src/utils.js";

const transactions = [
  { type: "income", category: "Income", amount: 500 },
  { type: "expense", category: "Food", amount: 40 },
  { type: "expense", category: "Bills", amount: 120 },
  { type: "expense", category: "Food", amount: 10 },
];

const budgets = [
  { id: "1", category: "Food", monthlyLimit: 100 },
  { id: "2", category: "Bills", monthlyLimit: 150 },
];

// Utility test: totals summary
test("calculateTotals returns income, expenses, and balance", () => {
  const totals = calculateTotals(transactions);

  assert.equal(totals.income, 500);
  assert.equal(totals.expenses, 170);
  assert.equal(totals.balance, 330);
});

// Utility test: category filter
test("filterByCategory returns only matching categories", () => {
  const filtered = filterByCategory(transactions, "Food");

  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].category, "Food");
  assert.equal(filtered[1].category, "Food");
});

// Utility test: all filter
test('filterByCategory returns all items for "all"', () => {
  const filtered = filterByCategory(transactions, "all");

  assert.equal(filtered.length, transactions.length);
});

// Utility test: budget spent amount
test("calculateBudgetStatus adds spent amount to each budget", () => {
  const status = calculateBudgetStatus(budgets, transactions);

  assert.equal(status[0].spent, 50);
  assert.equal(status[1].spent, 120);
});

// Utility test: budget remaining amount
test("calculateBudgetStatus calculates remaining budget", () => {
  const status = calculateBudgetStatus(budgets, transactions);

  assert.equal(status[0].remaining, 50);
  assert.equal(status[1].remaining, 30);
});
