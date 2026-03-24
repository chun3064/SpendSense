// Basic validation for transaction requests
function validateTransaction(transaction) {
  if (!transaction.title || typeof transaction.title !== "string") {
    return "Transaction title is required.";
  }

  if (
    typeof transaction.amount !== "number" ||
    Number.isNaN(transaction.amount) ||
    transaction.amount < 0
  ) {
    return "Transaction amount must be a valid number.";
  }

  if (!transaction.category || typeof transaction.category !== "string") {
    return "Transaction category is required.";
  }

  if (!["income", "expense"].includes(transaction.type)) {
    return "Transaction type must be income or expense.";
  }

  return null;
}

module.exports = {
  validateTransaction,
};
