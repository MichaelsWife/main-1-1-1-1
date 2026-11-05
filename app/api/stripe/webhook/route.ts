import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getStripe } from "@/lib/stripe";
import type { Order } from "@/lib/store";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function markPaid(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  const orderId = session.metadata?.orderId;
  if (!orderId || !/^[a-f\d]{24}$/i.test(orderId)) throw new Error("Stripe session has no valid order reference");

  const db = await getDatabase();
  const orders = db.collection<Order>("orders");
  const order = await orders.findOne({ _id: new (await import("mongodb")).ObjectId(orderId) });
  if (!order) throw new Error("Order referenced by Stripe session was not found");
  if (order.stripeCheckoutSessionId !== session.id || order.userId !== session.metadata?.userId) throw new Error("Stripe session does not match the stored order");
  if (order.currency.toLowerCase() !== session.currency || order.subtotalCents !== session.amount_total) throw new Error("Stripe amount/currency does not match order");

  await orders.updateOne(
    { _id: order._id, stripeCheckoutSessionId: session.id, status: "awaiting_payment" },
    { $set: { status: "paid", stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : undefined, paidAt: new Date(), updatedAt: new Date() } },
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return NextResponse.json({ error: "Webhook is not configured." }, { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.warn("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await markPaid(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId && /^[a-f\d]{24}$/i.test(orderId)) {
        const { ObjectId } = await import("mongodb");
        await (await getDatabase()).collection<Order>("orders").updateOne(
          { _id: new ObjectId(orderId), stripeCheckoutSessionId: session.id, status: "awaiting_payment" },
          { $set: { status: "cancelled", updatedAt: new Date() } },
        );
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handling failed", { eventId: event.id, error });
    return NextResponse.json({ error: "Webhook processing failed; Stripe can retry delivery." }, { status: 500 });
  }
}
