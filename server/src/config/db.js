const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "spendsense";

const client = new MongoClient(uri);
let database = null;

// Connect to MongoDB once and reuse that connection
async function connectToDatabase() {
  if (database) {
    return database;
  }

  await client.connect();
  database = client.db(dbName);
  console.log(`Connected to MongoDB database: ${dbName}`);
  return database;
}

// Return the active database connection for controllers
function getDatabase() {
  if (!database) {
    throw new Error("Database connection has not been initialized.");
  }

  return database;
}

// Close MongoDB connection after tests
async function closeDatabase() {
  if (!database) {
    return;
  }

  await client.close();
  database = null;
}

module.exports = {
  connectToDatabase,
  closeDatabase,
  getDatabase,
};
