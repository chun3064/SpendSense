import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { validateTransaction } = require("../../server/src/utils/validateTransaction.js");
const { validateBudget } = require("../../server/src/utils/validateBudget.js");

// Validation test: valid transaction
test("validateTransaction accepts a valid transaction", () => {
  const result = validateTransaction({
    title: "Groceries",
    amount: 45.25,
    category: "Food",
    type: "expense",
  });

  assert.equal(result, null);
});

// Validation test: invalid transaction
test("validateTransaction rejects an invalid transaction type", () => {
  const result = validateTransaction({
    title: "Bad Data",
    amount: 20,
    category: "Food",
    type: "other",
  });

  assert.equal(result, "Transaction type must be income or expense.");
});

// Validation test: valid budget
test("validateBudget accepts a valid budget", () => {
  const result = validateBudget({
    category: "Food",
    monthlyLimit: 200,
  });

  assert.equal(result, null);
});

// Validation test: invalid budget
test("validateBudget rejects a negative monthly limit", () => {
  const result = validateBudget({
    category: "Food",
    monthlyLimit: -25,
  });

  assert.equal(result, "Monthly limit must be a valid positive number.");
});
