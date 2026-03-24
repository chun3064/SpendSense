import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017";
process.env.DB_NAME = "spendsense_test";

const require = createRequire(import.meta.url);
const app = require("../../server/src/app.js");
const {
  closeDatabase,
  connectToDatabase,
  getDatabase,
} = require("../../server/src/config/db.js");

let server;
let baseUrl;

async function clearCollections() {
  let db;

  try {
    db = getDatabase();
  } catch (error) {
    return;
  }

  await db.collection("transactions").deleteMany({});
  await db.collection("budgets").deleteMany({});
}

test.before(async () => {
  await connectToDatabase();
  await clearCollections();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await clearCollections();
  await closeDatabase();
});

// API test: create transaction
test("POST /api/transactions creates a transaction", async () => {
  const response = await fetch(`${baseUrl}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Gas",
      amount: 35,
      category: "Transportation",
      type: "expense",
      date: "2026-03-20",
      isRecurring: false,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.title, "Gas");
  assert.equal(data.category, "Transportation");
});

// API test: create budget
test("POST /api/budgets creates a budget", async () => {
  const response = await fetch(`${baseUrl}/api/budgets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category: "Food",
      monthlyLimit: 250,
      month: 3,
      year: 2026,
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.category, "Food");
  assert.equal(data.monthlyLimit, 250);
});
