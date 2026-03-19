export function calculateTotals(items) {
  return items.reduce(
    (totals, item) => {
      if (item.type === "income") {
        totals.income += item.amount;
      } else {
        totals.expenses += item.amount;
      }

      totals.balance = totals.income - totals.expenses;
      return totals;
    },
    { income: 0, expenses: 0, balance: 0 },
  );
}

export function filterByCategory(items, category) {
  if (category === "all") return [...items];
  return items.filter((item) => item.category === category);
}

export function calculateBudgetStatus(budgets, transactions) {
  return budgets.map((budget) => {
    const spent = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category === budget.category,
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      ...budget,
      spent,
      remaining: budget.monthlyLimit - spent,
    };
  });
}
