import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDatabase } from "@/lib/mongodb";
import type { Order } from "@/lib/store";
import { ObjectId } from "mongodb";

function money(cents: number, currency: string) { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  let orders: (Order & { _id: ObjectId })[] = [];
  try { const db = await getDatabase(); orders = await db.collection<Order>("orders").find({ userId: user.id }).sort({ createdAt: -1 }).limit(50).toArray() as typeof orders; } catch { /* Surface setup state below. */ }
  return <main className="content-page"><p className="eyebrow">YOUR ACCOUNT</p><h1>Hello, {user.email?.split("@")[0] || "there"}.</h1><p>{user.email}</p><section className="orders-section"><h2>Your orders</h2>{orders.length ? orders.map((order) => <article className="order-card" key={order._id.toString()}><div><strong>{order.status.replaceAll("_", " ")}</strong><p>{new Date(order.createdAt).toLocaleDateString()}</p></div><div>{order.items.map((item) => <p key={item.productId.toString()}>{item.quantity} × {item.name}</p>)}</div><strong>{money(order.subtotalCents, order.currency)}</strong></article>) : <p>No orders yet. Orders will appear here after checkout.</p>}</section></main>;
}
