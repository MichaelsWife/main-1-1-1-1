import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDatabase } from "@/lib/mongodb";
import type { Order } from "@/lib/store";

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
