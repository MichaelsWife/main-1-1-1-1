# The Rapture — E-commerce starter

A Next.js App Router storefront with Supabase Auth, MongoDB catalog/order storage, and Stripe Checkout payments.

## Local setup

1. Use Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local`. Set the Supabase publishable/anon key, MongoDB URI, and Stripe credentials there. `SUPABASE_DB_URL` is only needed for direct PostgreSQL access and migrations.
3. Keep all real secrets in `.env.local` or your deployment provider's secret settings; never commit them or paste database passwords into chat/issues/PRs. The database connection URL uses the password placeholder—replace it locally and percent-encode special characters in the password.
4. In Supabase Auth settings, configure local/deployed site URLs and allow `/auth/callback`.
5. In Stripe, use test keys first. Configure a webhook endpoint at `https://YOUR-DOMAIN/api/stripe/webhook` for `checkout.session.completed` and `checkout.session.async_payment_succeeded` (also optionally `checkout.session.expired`).
6. Set `SHIPPING_COUNTRIES` to comma-separated ISO two-letter country codes you actually serve, e.g. `US,CA`.
7. Seed sample products with `npm run seed`; run `npm run dev` and open `http://localhost:3000`.

## Supabase Agent Skills

Project-level Supabase and PostgreSQL guidance is installed under `.agents/skills/` for compatible coding agents. To add or refresh the complete upstream skill set in a local checkout, run `npm run skills:add` (equivalent to `npx skills add supabase/agent-skills`). No database credentials are required to install skills.

## Payment flow

The server creates a pending order using current MongoDB product prices, then creates a Stripe-hosted Checkout Session from those server-owned prices. The browser never supplies payment amounts or order ownership.

## Data model

- **Supabase Auth** is identity. `@supabase/ssr` stores/refreshes sessions in cookies. Protected pages and APIs call `auth.getUser()`; never trust a user ID supplied by the browser.
- **MongoDB `products`**: `{ _id, name, slug, description, priceCents, currency, imageUrl?, category, active, createdAt, updatedAt }`.
- **MongoDB `orders`**: user ID, checkout request ID, Stripe session/payment intent IDs, payment/order status, item snapshots, currency/subtotal, shipping address, timestamps. Unique indexes support idempotency.
- **MongoDB `stripeEvents`** indexes event IDs for event auditing; webhook state updates are idempotent so Stripe retries are safe.

## Launch checklist

This provides a real Stripe Checkout payment path, but it is not a complete fulfillment stack. Before live sales: use live Stripe keys and a verified HTTPS webhook; configure Stripe tax or a compliant tax workflow; confirm shipping, refunds, privacy, and fulfillment; and set all production secrets in the hosting provider.
