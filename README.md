# SpendSense

SpendSense is a personal finance tracking web app for the CS 341 final project. It helps users track income and expenses, view budget summaries, and organize transactions by category.

## Project Structure

```text
FinalProject/
  client/
  server/
  README.md
```

## Planned MVP

- Register and login
- Add, edit, and delete transactions
- View transactions in a table
- Set category budgets
- View dashboard summaries

## Recommended Build Order

1. Start the server and connect MongoDB
2. Test transaction routes
3. Start the React client
4. Connect the dashboard and transaction form
5. Add authentication
6. Add tests, deployment, and polish

## Notes

- The scaffold matches your class style: modular files, utility helpers, and readable Express routes.
- The front end now uses React with `useState` for form state, filters, and live dashboard updates so it matches the rubric.
