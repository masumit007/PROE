const { MongoClient } = require("mongodb");

let client;
let db;

async function connectToMongo() {
  if (db) return db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing. Copy .env.example to .env and configure it.");
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB || "proe");
  await db.collection("activity_events").createIndex({ timestamp: -1 });
  await db.collection("activity_events").createIndex({ eventType: 1, timestamp: -1 });
  return db;
}

function getDb() {
  if (!db) throw new Error("MongoDB is not connected.");
  return db;
}

async function closeMongo() {
  if (client) await client.close();
  client = undefined;
  db = undefined;
}

module.exports = { connectToMongo, getDb, closeMongo };
