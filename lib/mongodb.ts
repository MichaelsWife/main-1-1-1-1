import { MongoClient } from "mongodb";

type MongoGlobal = typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
const globalWithMongo = globalThis as MongoGlobal;

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured");
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    globalWithMongo._mongoClientPromise = client.connect();
  }
  return globalWithMongo._mongoClientPromise;
}

export async function getDatabase() {
  const client = await getMongoClient();
  return client.db(process.env.MONGODB_DB || "therapture");
}
