import { useEffect, useRef, useState } from "react";
import {
  calculateBudgetStatus,
  calculateTotals,
  filterByCategory,
  roundCurrency,
} from "./utils.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const CHART_COLORS = [
  "#3c72c7",
  "#cf5f52",
  "#2d8f5b",
  "#1f8f55",
  "#6c63a8",
  "#d97706",
  "#0f766e",
  "#be185d",
  "#7c3aed",
  "#4b5563",
];
const EXPENSE_CATEGORIES = ["Food", "Transportation", "Entertainment", "School", "Bills"];

// Summary card shown at the top of the dashboard
function SummaryCard({ label, value, tone }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <p className="summary-label">{label}</p>
      <p className="summary-value">{value}</p>
    </article>
  );
}

// Format stored dates for display in the table
function formatDisplayDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Canvas chart for expense totals by category
function SpendingChart({ transactions }) {
  const canvasRef = useRef(null);

  const expenseTotals = transactions.reduce((totals, transaction) => {
    if (transaction.type !== "expense") return totals;
    if (transaction.category === "Income") return totals;
    totals[transaction.category] = roundCurrency(
      (totals[transaction.category] ?? 0) + transaction.amount,
    );
    return totals;
  }, {});

  const categories = Object.keys(expenseTotals);
  const totalExpenses = Object.values(expenseTotals).reduce(
    (sum, value) => roundCurrency(sum + value),
    0,
  );
  const chartItems = categories.map((category) => ({
    category,
    amount: expenseTotals[category],
    percent: totalExpenses === 0 ? 0 : (expenseTotals[category] / totalExpenses) * 100,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (categories.length === 0) {
      context.fillStyle = "#5d6a7a";
      context.font = "16px Avenir Next";
      context.fillText("No expense data yet.", 20, 60);
      return;
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 100;
    const innerRadius = 56;
    let startAngle = -Math.PI / 2;

    chartItems.forEach((item, index) => {
      const sliceAngle = (item.amount / totalExpenses) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      context.closePath();
      context.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
      context.fill();

      startAngle = endAngle;
    });

    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    context.fill();
    context.globalCompositeOperation = "source-over";
  }, [transactions, categories.length, totalExpenses]);

  return (
    <article className="panel chart-panel">
      <h2>Expense Chart</h2>
      <div className="insights-layout">
        <section className="insights-total">
          <p className="insights-label">Total Expenses</p>
          <p className="insights-value">${totalExpenses.toFixed(2)}</p>
        </section>

        <section className="insights-canvas-wrap">
          <canvas
            ref={canvasRef}
            className="spending-chart"
            width="260"
            height="260"
            aria-label="Expense totals by category"
          />
        </section>

        <section className="insights-legend">
          {chartItems.length === 0 ? (
            <p>No expense data yet.</p>
          ) : (
            chartItems.map((item, index) => (
              <div key={item.category} className="legend-row">
                <span
                  className="legend-color"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="legend-category">{item.category}</span>
                <span className="legend-amount">${item.amount.toFixed(2)}</span>
                <span className="legend-percent">{item.percent.toFixed(1)}%</span>
              </div>
            ))
          )}
        </section>
      </div>
    </article>
  );
}

const defaultFormState = {
  title: "",
  amount: "",
  category: "Food",
  type: "expense",
  date: new Date().toISOString().slice(0, 10),
  isRecurring: false,
};

const defaultBudgetFormState = {
  category: "Food",
  monthlyLimit: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
};

// Transaction form for creating and editing transactions
function TransactionForm({ editingTransaction, onSaveTransaction, onCancelEdit }) {
  const [formState, setFormState] = useState({
    ...defaultFormState,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const categoryOptions = formState.type === "income" ? ["Income"] : EXPENSE_CATEGORIES;

  // Load selected transaction values into the form when editing
  useEffect(() => {
    if (!editingTransaction) {
      setFormState({ ...defaultFormState });
      return;
    }

    setFormState({
      title: editingTransaction.title,
      amount: String(editingTransaction.amount),
      category: editingTransaction.category,
      type: editingTransaction.type,
      date: editingTransaction.date,
      isRecurring: Boolean(editingTransaction.isRecurring),
    });
  }, [editingTransaction]);

  // Keep category in sync with the selected type
  useEffect(() => {
    if (formState.type === "income" && formState.category !== "Income") {
      setFormState((current) => ({
        ...current,
        category: "Income",
      }));
      return;
    }

    if (formState.type === "expense" && formState.category === "Income") {
      setFormState((current) => ({
        ...current,
        category: "Food",
      }));
    }
  }, [formState.type, formState.category]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      await onSaveTransaction(formState);

      setFormState({ ...defaultFormState });
      setMessage(editingTransaction ? "Transaction updated." : "Transaction saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <p className="form-mode">
          {editingTransaction ? "Editing transaction" : "Add a transaction"}
        </p>

        <label>
          Title
          <input
            type="text"
            name="title"
            value={formState.title}
            onChange={handleChange}
            placeholder="Ex: Grocery run"
            required
          />
        </label>

        <label>
          Amount
          <input
            type="number"
            name="amount"
            value={formState.amount}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </label>

        <label>
          Date
          <input
            type="date"
            name="date"
            value={formState.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Category
          <select name="category" value={formState.category} onChange={handleChange}>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="transaction-type">
          <legend>Type</legend>

          <label className="radio-option">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formState.type === "expense"}
              onChange={handleChange}
            />
            Expense
          </label>

          <label className="radio-option">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formState.type === "income"}
              onChange={handleChange}
            />
            Income
          </label>
        </fieldset>

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="isRecurring"
            checked={formState.isRecurring}
            onChange={handleChange}
          />
          Recurring payment
        </label>

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : editingTransaction ? "Update Transaction" : "Save Transaction"}
        </button>

        {editingTransaction ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setFormState({ ...defaultFormState });
              setMessage("");
              onCancelEdit();
            }}
          >
            Cancel Edit
          </button>
        ) : null}
      </form>

      <p className="form-message">{message}</p>
    </>
  );
}

// Transaction table with filter and action buttons
function TransactionTable({
  transactions,
  categoryFilter,
  onFilterChange,
  onEditTransaction,
  onDeleteTransaction,
  activeEditId,
  sortConfig,
  onSortChange,
}) {
  function renderSortIndicator(key) {
    if (sortConfig.key !== key) return "";
    return sortConfig.direction === "asc" ? " ^" : " v";
  }

  return (
    <article className="panel" id="transactions">
      <div className="panel-header">
        <h2>Recent Transactions</h2>

        <label className="filter-label">
          Filter
          <select value={categoryFilter} onChange={(event) => onFilterChange(event.target.value)}>
            <option value="all">All</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="School">School</option>
            <option value="Bills">Bills</option>
            <option value="Income">Income</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <button type="button" className="table-sort-button" onClick={() => onSortChange("title")}>
                  <span>Title{renderSortIndicator("title")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-button" onClick={() => onSortChange("category")}>
                  <span>Category{renderSortIndicator("category")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-button" onClick={() => onSortChange("type")}>
                  <span>Type{renderSortIndicator("type")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-button" onClick={() => onSortChange("amount")}>
                  <span>Amount{renderSortIndicator("amount")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="table-sort-button" onClick={() => onSortChange("date")}>
                  <span>Date{renderSortIndicator("date")}</span>
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className={transaction.id === activeEditId ? "table-row--active" : ""}
              >
                <td>{transaction.title}</td>
                <td>{transaction.category}</td>
                <td>{transaction.type}</td>
                <td>${transaction.amount.toFixed(2)}</td>
                <td className="date-cell">{formatDisplayDate(transaction.date)}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-button"
                      onClick={() => onEditTransaction(transaction)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="table-button table-button--danger"
                      onClick={() => onDeleteTransaction(transaction.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

// Budget form for creating and editing budgets
function BudgetForm({ editingBudget, onSaveBudget, onCancelEdit }) {
  const [formState, setFormState] = useState({ ...defaultBudgetFormState });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load selected budget values into the form when editing
  useEffect(() => {
    if (!editingBudget) {
      setFormState({ ...defaultBudgetFormState });
      return;
    }

    setFormState({
      category: editingBudget.category,
      monthlyLimit: String(editingBudget.monthlyLimit),
      month: String(editingBudget.month),
      year: String(editingBudget.year),
    });
  }, [editingBudget]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);

    try {
      await onSaveBudget(formState);
      setFormState({ ...defaultBudgetFormState });
      setMessage(editingBudget ? "Budget updated." : "Budget saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <p className="form-mode">
          {editingBudget ? "Editing budget" : "Add a budget"}
        </p>

        <label>
          Category
          <select name="category" value={formState.category} onChange={handleChange}>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="School">School</option>
            <option value="Bills">Bills</option>
          </select>
        </label>

        <label>
          Monthly Limit
          <input
            type="number"
            name="monthlyLimit"
            value={formState.monthlyLimit}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </label>

        <label>
          Month
          <input
            type="number"
            name="month"
            value={formState.month}
            onChange={handleChange}
            min="1"
            max="12"
            required
          />
        </label>

        <label>
          Year
          <input
            type="number"
            name="year"
            value={formState.year}
            onChange={handleChange}
            min="2024"
            max="2100"
            required
          />
        </label>

        <button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : editingBudget ? "Update Budget" : "Save Budget"}
        </button>

        {editingBudget ? (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setFormState({ ...defaultBudgetFormState });
              setMessage("");
              onCancelEdit();
            }}
          >
            Cancel Edit
          </button>
        ) : null}
      </form>

      <p className="form-message">{message}</p>
    </>
  );
}

// Budgets page content
function BudgetPanel({
  budgets,
  budgetStatus,
  editingBudget,
  onSaveBudget,
  onEditBudget,
  onDeleteBudget,
  onCancelEdit,
}) {
  return (
    <section className="budget-section" id="budgets">
      <article className="panel">
        <h2>{editingBudget ? "Edit Budget" : "Category Budgets"}</h2>
        <BudgetForm
          editingBudget={editingBudget}
          onSaveBudget={onSaveBudget}
          onCancelEdit={onCancelEdit}
        />
      </article>

      <article className="panel">
        <div className="panel-header">
          <h2>Budgets</h2>
        </div>

        {budgetStatus.length === 0 ? (
          <p>No budgets yet.</p>
        ) : (
          <div className="budget-list">
            {budgetStatus.map((budget) => (
              <article
                key={budget.id}
                className={`budget-card ${budget.remaining < 0 ? "budget-card--over" : ""}`}
              >
                <div className="budget-card__header">
                  <div>
                    <h3>{budget.category}</h3>
                    <p>
                      {budget.month}/{budget.year}
                    </p>
                  </div>

                  <div className="table-actions">
                    <button
                      type="button"
                      className="table-button"
                      onClick={() => onEditBudget(budget)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="table-button table-button--danger"
                      onClick={() => onDeleteBudget(budget.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p>Limit: ${budget.monthlyLimit.toFixed(2)}</p>
                <p>Spent: ${budget.spent.toFixed(2)}</p>
                <p>Remaining: ${budget.remaining.toFixed(2)}</p>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

// Small cards for remaining budget amounts
function RemainingBudgetCards({ budgetStatus }) {
  if (budgetStatus.length === 0) {
    return (
      <article className="panel">
        <h2>Remaining Budgets</h2>
        <p>No budgets yet.</p>
      </article>
    );
  }

  return (
    <article className="panel">
      <h2>Remaining Budgets</h2>
      <div className="remaining-budget-grid">
        {budgetStatus.map((budget) => (
          <article
            key={budget.id}
            className={`remaining-budget-card ${budget.remaining < 0 ? "remaining-budget-card--over" : ""}`}
          >
            <p className="remaining-budget-card__category">{budget.category}</p>
            <p className="remaining-budget-card__amount">${budget.remaining.toFixed(2)}</p>
            <p className="remaining-budget-card__meta">
              Spent ${budget.spent.toFixed(2)} of ${budget.monthlyLimit.toFixed(2)}
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}

// Main app state and page switching
function App() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

  // Load transactions and budgets when the app starts
  useEffect(() => {
    async function loadData() {
      try {
        const [transactionsResponse, budgetsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/transactions`),
          fetch(`${API_BASE_URL}/budgets`),
        ]);
        const transactionsData = await transactionsResponse.json();
        const budgetsData = await budgetsResponse.json();

        if (!transactionsResponse.ok) {
          throw new Error(transactionsData.error || "Failed to load transactions.");
        }

        if (!budgetsResponse.ok) {
          throw new Error(budgetsData.error || "Failed to load budgets.");
        }

        setTransactions(transactionsData);
        setBudgets(budgetsData);
      } catch (error) {
        setLoadError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const totals = calculateTotals(transactions);
  const filteredTransactions = filterByCategory(transactions, categoryFilter);
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortConfig.key === "amount") {
      return sortConfig.direction === "asc" ? a.amount - b.amount : b.amount - a.amount;
    }

    if (sortConfig.key === "date") {
      const first = new Date(a.date);
      const second = new Date(b.date);
      return sortConfig.direction === "asc" ? first - second : second - first;
    }

    const firstValue = String(a[sortConfig.key]).toLowerCase();
    const secondValue = String(b[sortConfig.key]).toLowerCase();

    if (sortConfig.direction === "asc") {
      return firstValue.localeCompare(secondValue);
    }

    return secondValue.localeCompare(firstValue);
  });
  const budgetStatus = calculateBudgetStatus(budgets, transactions);

  // Save a new transaction or update an existing one
  async function handleSaveTransaction(formState) {
    const payload = {
      ...formState,
      amount: roundCurrency(formState.amount),
      date: formState.date,
    };

    const method = editingTransaction ? "PATCH" : "POST";
    const url = editingTransaction
      ? `${API_BASE_URL}/transactions/${editingTransaction.id}`
      : `${API_BASE_URL}/transactions`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save transaction.");
    }

    if (editingTransaction) {
      setTransactions((current) =>
        current.map((transaction) =>
          transaction.id === editingTransaction.id ? data : transaction,
        ),
      );
      setEditingTransaction(null);
      return;
    }

    setTransactions((current) => [data, ...current]);
  }

  // Remove a transaction from both MongoDB and local state
  async function handleDeleteTransaction(transactionId) {
    const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete transaction.");
    }

    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== transactionId),
    );

    if (editingTransaction?.id === transactionId) {
      setEditingTransaction(null);
    }
  }

  // Save a new budget or update an existing one
  async function handleSaveBudget(formState) {
    const payload = {
      category: formState.category,
      monthlyLimit: roundCurrency(formState.monthlyLimit),
      month: Number(formState.month),
      year: Number(formState.year),
    };

    const method = editingBudget ? "PATCH" : "POST";
    const url = editingBudget
      ? `${API_BASE_URL}/budgets/${editingBudget.id}`
      : `${API_BASE_URL}/budgets`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to save budget.");
    }

    if (editingBudget) {
      setBudgets((current) =>
        current.map((budget) => (budget.id === editingBudget.id ? data : budget)),
      );
      setEditingBudget(null);
      return;
    }

    setBudgets((current) => [data, ...current]);
  }

  // Remove a budget from both MongoDB and local state
  async function handleDeleteBudget(budgetId) {
    const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}`, {
      method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete budget.");
    }

    setBudgets((current) => current.filter((budget) => budget.id !== budgetId));

    if (editingBudget?.id === budgetId) {
      setEditingBudget(null);
    }
  }

  // Top navigation handlers
  function openDashboard() {
    setActivePage("dashboard");
  }

  function openBudgets() {
    setActivePage("budgets");
  }

  function openInsights() {
    setActivePage("insights");
  }

  function handleSortChange(key) {
    setSortConfig((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: key === "date" ? "desc" : "asc",
      };
    });
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>SpendSense</h1>
        <p className="hero-copy">
          Personal finance app for tracking transactions and monthly budgets.
        </p>
        <img src="/money.avif" alt="Money and financial planning visual" className="hero-image" />
        <nav className="nav" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-link ${activePage === "dashboard" ? "nav-link--active" : ""}`}
            onClick={openDashboard}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === "budgets" ? "nav-link--active" : ""}`}
            onClick={openBudgets}
          >
            Budgets
          </button>
          <button
            type="button"
            className={`nav-link ${activePage === "insights" ? "nav-link--active" : ""}`}
            onClick={openInsights}
          >
            Insights
          </button>
        </nav>
      </header>

      <main className="dashboard">
        {activePage === "dashboard" ? (
          <>
            <section className="page-intro">
              <h2>Dashboard</h2>
              <p>View totals and recent transactions.</p>
            </section>

            <section className="summary-grid" aria-label="Financial summary">
              <SummaryCard label="Income" value={`$${totals.income.toFixed(2)}`} tone="income" />
              <SummaryCard label="Expenses" value={`$${totals.expenses.toFixed(2)}`} tone="expense" />
              <SummaryCard label="Balance" value={`$${totals.balance.toFixed(2)}`} tone="balance" />
            </section>

            <section className="panel-grid">
              <article className="panel" id="add-transaction">
                <h2>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
                <TransactionForm
                  editingTransaction={editingTransaction}
                  onSaveTransaction={handleSaveTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                />
              </article>

              {isLoading ? (
                <article className="panel">
                  <h2>Recent Transactions</h2>
                  <p>Loading transactions...</p>
                </article>
              ) : loadError ? (
                <article className="panel">
                  <h2>Recent Transactions</h2>
                  <p>{loadError}</p>
                </article>
              ) : (
                <TransactionTable
                  transactions={sortedTransactions}
                  categoryFilter={categoryFilter}
                  onFilterChange={setCategoryFilter}
                  onEditTransaction={setEditingTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  activeEditId={editingTransaction?.id ?? null}
                  sortConfig={sortConfig}
                  onSortChange={handleSortChange}
                />
              )}
            </section>
          </>
        ) : null}

        {activePage === "budgets" ? (
          <>
            <section className="page-intro">
              <h2>Budgets</h2>
              <p>Set monthly limits by category and compare them against your current spending.</p>
            </section>

            {isLoading ? (
              <article className="panel">
                <h2>Budgets</h2>
                <p>Loading budgets...</p>
              </article>
            ) : loadError ? (
              <article className="panel">
                <h2>Budgets</h2>
                <p>{loadError}</p>
              </article>
            ) : (
              <BudgetPanel
                budgets={budgets}
                budgetStatus={budgetStatus}
                editingBudget={editingBudget}
                onSaveBudget={handleSaveBudget}
                onEditBudget={setEditingBudget}
                onDeleteBudget={handleDeleteBudget}
                onCancelEdit={() => setEditingBudget(null)}
              />
            )}
          </>
        ) : null}

        {activePage === "insights" ? (
          <>
            <section className="page-intro">
              <h2>Insights</h2>
              <p>View expense totals by category.</p>
            </section>

            <section className="chart-section">
              <SpendingChart transactions={transactions} />
            </section>

            <section className="chart-section">
              <RemainingBudgetCards budgetStatus={budgetStatus} />
            </section>
          </>
        ) : null}
      </main>

      <footer className="site-footer">
        <p>SpendSense | Wesley Chun | 2026</p>
      </footer>
    </div>
  );
}

export default App;
