# SpendSense

SpendSense is my CS 341 final project. It is a personal finance web app for tracking transactions, managing budgets, and getting a quick view of spending by category.

## Live Site

The website is live here:

https://spend-sense-wheat.vercel.app

## Features

- Add, edit, and delete transactions
- Filter transactions by category
- Sort transactions by table headers
- View income, expenses, and current balance
- Add, edit, and delete monthly budgets
- Compare budget limits against money already spent in that category
- View an Insights page with an expense chart and remaining budget cards

## Tech Used

- React
- Node.js
- Express
- MongoDB
- CSS

## Project Structure

```text
FinalProject/
  client/
  server/
  tests/
  README.md
```

## How To Run

Open two terminal windows.

### Server

```bash
cd server
npm install
npm run dev
```

### Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

After that, open the local URL shown by Vite in the browser.

## How To Run Tests

From the `FinalProject` folder:

```bash
npm run test:unit
npm run test:api
```

Or run everything with:

```bash
npm test
```

## Environment File

For local development, create a `.env` file in the `server` folder using `.env.example`.

Example:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=spendsense
CORS_ORIGIN=http://localhost:5173
```

Create a `.env` file in the `client` folder using `.env.example`.

Example:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Deployment Notes

This project can be deployed with:

- Vercel for the frontend
- Render for the backend
- MongoDB Atlas for the database

If deployed, the frontend should use the Render backend URL for `VITE_API_BASE_URL`, and the backend should use the Vercel frontend URL for `CORS_ORIGIN`.

## API Routes

- `GET /api/transactions`
- `POST /api/transactions`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/budgets`
- `POST /api/budgets`
- `PATCH /api/budgets/:id`
- `DELETE /api/budgets/:id`

## Database Collections

- `transactions`
- `budgets`

## Test Files

- `tests/client/utils.test.mjs`
- `tests/server/validation.test.mjs`
- `tests/server/api.test.mjs`
