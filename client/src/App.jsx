import { useEffect, useState } from "react";
import {
  calculateBudgetStatus,
  calculateTotals,
  filterByCategory,
} from "./utils.js";

const API_BASE_URL = "http://localhost:3000/api";

function SummaryCard({ label, value, tone }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <p className="summary-label">{label}</p>
      <p className="summary-value">{value}</p>
    </article>
  );
}

const defaultFormState = {
  title: "",
  amount: "",
  category: "Food",
  type: "expense",
  isRecurring: false,
};

const defaultBudgetFormState = {
  category: "Food",
  monthlyLimit: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
};

function TransactionForm({ editingTransaction, onSaveTransaction, onCancelEdit }) {
  const [formState, setFormState] = useState({
    ...defaultFormState,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      isRecurring: Boolean(editingTransaction.isRecurring),
    });
  }, [editingTransaction]);

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
      setMessage(editingTransaction ? "Transaction updated successfully." : "Transaction saved successfully.");
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
          {editingTransaction ? "Editing selected transaction" : "Create a new transaction"}
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
          Category
          <select name="category" value={formState.category} onChange={handleChange}>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="School">School</option>
            <option value="Bills">Bills</option>
            <option value="Income">Income</option>
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

function TransactionTable({
  transactions,
  categoryFilter,
  onFilterChange,
  onEditTransaction,
  onDeleteTransaction,
  activeEditId,
}) {
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
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
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
                <td>{transaction.date}</td>
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

function BudgetForm({ editingBudget, onSaveBudget, onCancelEdit }) {
  const [formState, setFormState] = useState({ ...defaultBudgetFormState });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      setMessage(editingBudget ? "Budget updated successfully." : "Budget saved successfully.");
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
          {editingBudget ? "Editing selected budget" : "Create a category budget"}
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
          <h2>Budget Overview</h2>
        </div>

        {budgetStatus.length === 0 ? (
          <p>No budgets yet. Add one to track spending by category.</p>
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

function App() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingBudget, setEditingBudget] = useState(null);
  const [activePage, setActivePage] = useState("dashboard");

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
  const budgetStatus = calculateBudgetStatus(budgets, transactions);

  async function handleSaveTransaction(formState) {
    const payload = {
      ...formState,
      amount: Number(formState.amount),
      date: editingTransaction?.date ?? new Date().toISOString().slice(0, 10),
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

  async function handleSaveBudget(formState) {
    const payload = {
      category: formState.category,
      monthlyLimit: Number(formState.monthlyLimit),
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

  function openDashboard() {
    setActivePage("dashboard");
  }

  function openBudgets() {
    setActivePage("budgets");
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="eyebrow">CS 341 Final Project</p>
        <h1>SpendSense</h1>
        <p className="hero-copy">
          A personal finance tracker that helps students understand spending,
          stay on budget, and build better habits.
        </p>
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
        </nav>
      </header>

      <main className="dashboard">
        {activePage === "dashboard" ? (
          <>
            <section className="page-intro">
              <h2>Dashboard</h2>
              <p>Track income, expenses, and recent activity in one place.</p>
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
                  transactions={filteredTransactions}
                  categoryFilter={categoryFilter}
                  onFilterChange={setCategoryFilter}
                  onEditTransaction={setEditingTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  activeEditId={editingTransaction?.id ?? null}
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
                <h2>Budget Overview</h2>
                <p>Loading budgets...</p>
              </article>
            ) : loadError ? (
              <article className="panel">
                <h2>Budget Overview</h2>
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
      </main>
    </div>
  );
}

export default App;
