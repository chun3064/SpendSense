// Round money values to 2 decimal places
export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Calculate income, expenses, and balance from all transactions
export function calculateTotals(items) {
  return items.reduce(
    (totals, item) => {
      if (item.type === "income") {
        totals.income = roundCurrency(totals.income + item.amount);
      } else {
        totals.expenses = roundCurrency(totals.expenses + item.amount);
      }

      totals.balance = roundCurrency(totals.income - totals.expenses);
      return totals;
    },
    { income: 0, expenses: 0, balance: 0 },
  );
}

// Filter transactions by category ("all" returns everything)
export function filterByCategory(items, category) {
  if (category === "all") return [...items];
  return items.filter((item) => item.category === category);
}

// Compare each budget against matching expense transactions
export function calculateBudgetStatus(budgets, transactions) {
  return budgets.map((budget) => {
    const spent = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === budget.category,
      )
      .reduce((sum, transaction) => roundCurrency(sum + transaction.amount), 0);

    return {
      ...budget,
      spent,
      remaining: roundCurrency(budget.monthlyLimit - spent),
    };
  });
}
