const { MongoClient } = require("mongodb");

let client;
let db;

async function connectDB() {
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.DB_NAME || "secure_connect");

  // Unique email prevents duplicate accounts.
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("notes").createIndex({ ownerId: 1, createdAt: -1 });

  console.log("MongoDB connected");
  return db;
}

function getDB() {
  if (!db) throw new Error("Database is not connected");
  return db;
}

async function closeDB() {
  if (client) await client.close();
}

module.exports = { connectDB, getDB, closeDB };
