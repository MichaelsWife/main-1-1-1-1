# The Rapture — E-commerce starter

A Next.js App Router storefront with Supabase Auth, MongoDB catalog/order storage, and Stripe Checkout payments.

## Local setup

1. Use Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local`; configure Supabase, MongoDB, and Stripe server-side credentials.
3. In Supabase Auth settings, configure local/deployed site URLs and allow `/auth/callback`.
4. In Stripe, use test keys first. Configure a webhook endpoint at `https://YOUR-DOMAIN/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded` (also optionally `checkout.session.async_payment_failed`); set its signing secret as `STRIPE_WEBHOOK_SECRET`. For local testing, Stripe CLI can forward events to `http://localhost:3000/api/stripe/webhook`.
5. Set `SHIPPING_COUNTRIES` to comma-separated ISO two-letter country codes you actually serve, e.g. `US,CA`.
6. Seed sample products with `npm run seed`; run `npm run dev` and open `http://localhost:3000`.

## Payment flow

The server creates a pending order using current MongoDB product prices, then creates a Stripe-hosted Checkout Session from those server-owned prices. The browser never supplies payment amounts or Stripe secrets. Checkout retries reuse a per-request ID and Stripe idempotency key. The browser return page is informational only: an order is marked paid **only** after a Stripe-signed webhook is verified, and the webhook checks the session/order/user, currency, and amount before updating the order. The endpoint does not accept a client-side "paid" signal.

## Data model

- **Supabase Auth** is identity. `@supabase/ssr` stores/refreshes sessions in cookies. Protected pages and APIs call `auth.getUser()`; never trust a user ID supplied by the browser.
- **MongoDB `products`**: `{ _id, name, slug, description, priceCents, currency, imageUrl?, category, active, createdAt, updatedAt }`.
- **MongoDB `orders`**: user ID, checkout request ID, Stripe session/payment intent IDs, payment/order status, item snapshots, currency/subtotal, shipping address, timestamps. Unique indexes support idempotent checkout and session lookup.
- **MongoDB `stripeEvents`** indexes event IDs for future event auditing; webhook state updates are idempotent so Stripe retries are safe.

## Launch checklist

This provides a real Stripe Checkout payment path, but it is not a complete fulfillment stack. Before live sales: use live Stripe keys and a verified HTTPS webhook; configure Stripe tax or a compliant tax service; decide shipping costs and fulfillment rules (currently no shipping charge is added); add stock reservation/decrement with concurrency controls, refunds/chargebacks handling, cancellation/expiry reconciliation, rate limiting, alerting, admin authorization, receipts and customer support flows; review privacy/retention for addresses; run end-to-end tests with Stripe test cards. Keep MongoDB credentials and all Stripe secrets server-only. Never store card data in this app; Stripe Checkout hosts the payment form.
