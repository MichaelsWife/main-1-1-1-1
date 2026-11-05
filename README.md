# The Rapture — E-commerce starter

A Next.js App Router storefront with Supabase Auth and MongoDB catalog/order storage.

## Local setup

1. Use Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local`; set the Supabase project URL, publishable/anon key, MongoDB connection string, and database name.
3. In Supabase Auth settings, configure your local and deployed site URLs and allow the `/auth/callback` redirect URL.
4. Seed the sample catalog with `npm run seed` (uses the configured MongoDB database).
5. Run `npm run dev`, then open `http://localhost:3000`.

## Architecture and data model

- **Supabase Auth** is the identity provider. `@supabase/ssr` stores/refreshes sessions in secure cookies. Server-side protected pages and order APIs call `auth.getUser()`; never trust a user ID supplied by the browser.
- **MongoDB `products`**: `{ _id, name, slug, description, priceCents, currency, imageUrl?, category, active, createdAt, updatedAt }`. Unique slug and catalog indexes are created by the seed script / `ensureStoreIndexes` helper.
- **MongoDB `orders`**: `{ _id, userId, email, status, items: [{ productId, name, unitPriceCents, quantity, lineTotalCents }], currency, subtotalCents, shippingAddress, createdAt, updatedAt }`. Orders store product snapshots so later catalog changes do not rewrite order history. User ID is the Supabase Auth UUID; index supports user-owned order lookup.
- `GET /api/products` returns active products. `GET /api/orders` returns only the signed-in user's orders. `POST /api/orders` requires auth, validates input, fetches current active products and calculates prices/totals on the server.

## Security and production checklist

- Keep `MONGODB_URI` private and server-only. The Supabase publishable/anon key is safe to expose, but enable email confirmation and apply appropriate Supabase Auth policies/settings.
- MongoDB should use a dedicated least-privilege app user, TLS, network access restrictions, backups, and monitoring. Do not expose MongoDB credentials to the browser.
- The starter creates **pending orders only**. It does not collect payment or mark orders paid. Before taking real orders, integrate a payment provider using server-created payment sessions and signed webhooks; only verified webhooks should update order payment status. Add tax/shipping calculations, stock reservation/atomic inventory handling, idempotency keys, rate limiting, email notifications, admin authorization, and privacy/retention policies for shipping addresses.
- Add image hosting and validate/allowlist image URLs before enabling product management. Seed products are examples, not production inventory.
- Add automated tests and deploy with environment variables set in your hosting provider. Check `npm run typecheck` and `npm run build` before launch.
