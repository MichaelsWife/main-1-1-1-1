import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDatabase } from "@/lib/mongodb";
import { orderRequestSchema, type Order } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your orders." }, { status: 401 });
  try {
    const db = await getDatabase();
    const orders = await db.collection<Order>("orders").find({ userId: user.id }).sort({ createdAt: -1 }).limit(50).toArray();
    return NextResponse.json(orders.map((order) => ({ ...order, _id: order._id.toString() })), { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Orders are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before placing an order." }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = orderRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid order details.", details: parsed.error.flatten() }, { status: 400 });

  try {
    const db = await getDatabase();
    const ids = parsed.data.items.map((item) => new ObjectId(item.productId));
    const products = await db.collection("products").find({ _id: { $in: ids }, active: true }).toArray();
    if (products.length !== ids.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));
    const currencies = new Set(products.map((product) => product.currency || "USD"));
    if (currencies.size !== 1) return NextResponse.json({ error: "Products with different currencies cannot be ordered together." }, { status: 400 });

    const items = parsed.data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return { productId: product._id, name: product.name, unitPriceCents: product.priceCents, quantity: item.quantity, lineTotalCents: product.priceCents * item.quantity };
    });
    const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
    if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 100_000_000) return NextResponse.json({ error: "Order total is outside the permitted range." }, { status: 400 });
    const now = new Date();
    const order: Order = {
      userId: user.id, email: user.email || "", status: "awaiting_payment", items,
      currency: [...currencies][0], subtotalCents, shippingAddress: parsed.data.shippingAddress,
      createdAt: now, updatedAt: now,
    };
    const result = await db.collection<Order>("orders").insertOne(order);
    return NextResponse.json({ orderId: result.insertedId.toString(), status: order.status, subtotalCents, currency: order.currency }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not create the order. Please try again." }, { status: 503 });
  }
}
