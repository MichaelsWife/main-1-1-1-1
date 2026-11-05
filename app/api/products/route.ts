import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { serializeProduct, type Product } from "@/lib/store";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const db = await getDatabase();
    const products = await db.collection("products").find({ active: true }).sort({ createdAt: -1 }).limit(100).toArray();
    const serialized: Product[] = products.map((doc) => ({
      id: doc._id.toString(), name: doc.name, slug: doc.slug, description: doc.description,
      priceCents: doc.priceCents, currency: doc.currency, imageUrl: doc.imageUrl, category: doc.category,
      active: doc.active, createdAt: doc.createdAt, updatedAt: doc.updatedAt,
    }));
    return NextResponse.json(serialized, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Product catalog is temporarily unavailable." }, { status: 503 });
  }
}
