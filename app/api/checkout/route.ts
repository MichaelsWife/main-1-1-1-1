import { NextResponse } from "next/server";
import { ObjectId, MongoServerError } from "mongodb";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDatabase } from "@/lib/mongodb";
import { orderRequestSchema, type Order } from "@/lib/store";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before checkout." }, { status: 401 });

  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const parsed = orderRequestSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid checkout details.", details: parsed.error.flatten() }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Payments are not configured. Set the server-side Stripe keys and site URL." }, { status: 503 });
  }

  try {
    const db = await getDatabase();
    const orders = db.collection<Order>("orders");
    const requestId = parsed.data.checkoutRequestId;
    let order = await orders.findOne({ userId: user.id, checkoutRequestId: requestId });

    if (!order) {
      const ids = parsed.data.items.map((item) => new ObjectId(item.productId));
      const products = await db.collection("products").find({ _id: { $in: ids }, active: true }).toArray();
      if (products.length !== ids.length) return NextResponse.json({ error: "One or more products are unavailable." }, { status: 400 });
      const productMap = new Map(products.map((product) => [product._id.toString(), product]));
      const currencies = new Set(products.map((product) => String(product.currency || "USD").toUpperCase()));
      if (currencies.size !== 1) return NextResponse.json({ error: "Products with different currencies cannot be checked out together." }, { status: 400 });

      const items = parsed.data.items.map((item) => {
        const product = productMap.get(item.productId)!;
        return { productId: product._id, name: String(product.name), unitPriceCents: Number(product.priceCents), quantity: item.quantity, lineTotalCents: Number(product.priceCents) * item.quantity };
      });
      const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
      if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 1 || subtotalCents > 100_000_000 || items.some((item) => !Number.isSafeInteger(item.unitPriceCents) || item.unitPriceCents < 1)) {
        return NextResponse.json({ error: "Order total or product price is invalid." }, { status: 400 });
      }

      const now = new Date();
      const newOrder: Order = {
        userId: user.id,
        email: user.email || "",
        checkoutRequestId: requestId,
        status: "awaiting_payment",
        items,
        currency: [...currencies][0],
        subtotalCents,
        shippingAddress: parsed.data.shippingAddress,
        createdAt: now,
        updatedAt: now,
      };
      try {
        const result = await orders.insertOne(newOrder);
        order = { ...newOrder, _id: result.insertedId };
      } catch (error) {
        if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
        order = await orders.findOne({ userId: user.id, checkoutRequestId: requestId });
        if (!order) throw error;
      }
    }

    if (order.userId !== user.id) return NextResponse.json({ error: "Checkout is unavailable." }, { status: 404 });
    if (order.status !== "awaiting_payment") return NextResponse.json({ error: "This order is no longer payable." }, { status: 409 });

    const stripe = getStripe();
    let session = order.stripeCheckoutSessionId
      ? await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId)
      : null;

    if (!session) {
      const allowedCountries = (process.env.SHIPPING_COUNTRIES || "US").split(",").map((country) => country.trim().toUpperCase()).filter(Boolean);
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: user.email || undefined,
        client_reference_id: order._id.toString(),
        metadata: { orderId: order._id.toString(), userId: user.id },
        payment_intent_data: { metadata: { orderId: order._id.toString(), userId: user.id } },
        line_items: order.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: order.currency.toLowerCase(),
            unit_amount: item.unitPriceCents,
            product_data: { name: item.name },
          },
        })),
        billing_address_collection: "required",
        success_url: `${siteUrl.replace(/\/$/, "")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl.replace(/\/$/, "")}/cart?cancelled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        ...(allowedCountries.length ? { shipping_address_collection: { allowed_countries: allowedCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] } } : {}),
      }, { idempotencyKey: `checkout-${order._id.toString()}` });
      await orders.updateOne({ _id: order._id, status: "awaiting_payment" }, { $set: { stripeCheckoutSessionId: session.id, updatedAt: new Date() } });
    }

    if (!session.url) return NextResponse.json({ error: "This checkout session is no longer available. Return to your cart to try again." }, { status: 409 });
    return NextResponse.json({ checkoutUrl: session.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Checkout session creation failed", error);
    return NextResponse.json({ error: "Could not start secure checkout. Please try again." }, { status: 503 });
  }
}
