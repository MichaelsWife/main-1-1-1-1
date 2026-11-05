import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  // Keep the app bootable without credentials; database routes report a clear configuration error.
}

type MongoGlobal = typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
const globalWithMongo = globalThis as MongoGlobal;

export function getMongoClient(): Promise<MongoClient> {
  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) throw new Error("MONGODB_URI is not configured");

  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(connectionString);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  return globalWithMongo._mongoClientPromise;
}
