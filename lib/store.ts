import { z } from "zod";
import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

export const productSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default("USD"),
  imageUrl: z.string().url().optional(),
  category: z.string().min(1).max(80),
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type Product = z.infer<typeof productSchema> & { id: string };

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  line1: z.string().trim().min(3).max(150),
  line2: z.string().trim().max(150).optional().default(""),
  city: z.string().trim().min(2).max(100),
  region: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2),
});
export const orderRequestSchema = z.object({
  checkoutRequestId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
  shippingAddress: addressSchema,
}).superRefine(({ items }, ctx) => {
  if (new Set(items.map((item) => item.productId)).size !== items.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Duplicate products are not allowed." });
  }
});

export type Order = {
  userId: string;
  email: string;
  checkoutRequestId?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  status: "awaiting_payment" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  items: { productId: ObjectId; name: string; unitPriceCents: number; quantity: number; lineTotalCents: number }[];
  currency: string;
  subtotalCents: number;
  shippingAddress: z.infer<typeof addressSchema>;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
};

type ProductDocument = z.infer<typeof productSchema>;
export function serializeProduct(doc: WithId<ProductDocument>): Product {
  return { ...doc, id: doc._id.toString() };
}

export async function ensureStoreIndexes() {
  const db = await getDatabase();
  await Promise.all([
    db.collection("products").createIndex({ slug: 1 }, { unique: true }),
    db.collection("products").createIndex({ active: 1, category: 1 }),
    db.collection("orders").createIndex({ userId: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ status: 1, createdAt: -1 }),
    db.collection("orders").createIndex({ userId: 1, checkoutRequestId: 1 }, { unique: true, partialFilterExpression: { checkoutRequestId: { $type: "string" } } }),
    db.collection("orders").createIndex({ stripeCheckoutSessionId: 1 }, { unique: true, sparse: true }),
    db.collection("stripeEvents").createIndex({ eventId: 1 }, { unique: true }),
  ]);
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDatabase();
  const docs = await db.collection<ProductDocument>("products").find({ active: true }).sort({ createdAt: -1 }).limit(100).toArray();
  return docs.map(serializeProduct);
}
