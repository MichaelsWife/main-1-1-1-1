import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Set MONGODB_URI before running the product seed script.");
const client = new MongoClient(uri);
const now = new Date();
const products = [
  { name: "Everyday Carry Tote", slug: "everyday-carry-tote", description: "A durable, thoughtfully sized tote for work, errands, and all the in-between.", priceCents: 3200, currency: "USD", category: "Bags", active: true, createdAt: now, updatedAt: now },
  { name: "Ceramic Ritual Cup", slug: "ceramic-ritual-cup", description: "A hand-finished stoneware cup that makes your daily coffee feel like a ritual.", priceCents: 2400, currency: "USD", category: "Home", active: true, createdAt: now, updatedAt: now },
  { name: "Soft Form Notebook", slug: "soft-form-notebook", description: "A lay-flat, recycled-paper notebook for plans, lists, and good ideas.", priceCents: 1800, currency: "USD", category: "Stationery", active: true, createdAt: now, updatedAt: now },
];
try {
  await client.connect();
  const collection = client.db(process.env.MONGODB_DB || "therapture").collection("products");
  await collection.createIndex({ slug: 1 }, { unique: true });
  for (const product of products) await collection.updateOne({ slug: product.slug }, { $setOnInsert: product }, { upsert: true });
  console.log(`Seeded ${products.length} starter products (existing products left unchanged).`);
} finally { await client.close(); }
