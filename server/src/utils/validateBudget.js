// Basic validation for budget requests
function validateBudget(budget) {
  if (!budget.category || typeof budget.category !== "string") {
    return "Budget category is required.";
  }

  if (
    typeof budget.monthlyLimit !== "number" ||
    Number.isNaN(budget.monthlyLimit) ||
    budget.monthlyLimit < 0
  ) {
    return "Monthly limit must be a valid positive number.";
  }

  return null;
}

module.exports = {
  validateBudget,
};
