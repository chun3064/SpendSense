const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "spendsense";

const client = new MongoClient(uri);
let database = null;

async function connectToDatabase() {
  if (database) {
    return database;
  }

  await client.connect();
  database = client.db(dbName);
  console.log(`Connected to MongoDB database: ${dbName}`);
  return database;
}

function getDatabase() {
  if (!database) {
    throw new Error("Database connection has not been initialized.");
  }

  return database;
}

module.exports = {
  connectToDatabase,
  getDatabase,
};
