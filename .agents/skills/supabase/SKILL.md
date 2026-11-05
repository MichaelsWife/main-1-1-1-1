---
name: supabase
description: Use for any work involving Supabase Database, Auth, Storage, Realtime, Edge Functions, Supabase client libraries, Next.js SSR integration, migrations, or Row Level Security.
---

# Supabase project guidance

- Verify current Supabase docs and changelog for version-sensitive features before implementation.
- This project uses `@supabase/ssr` in Next.js. Use the existing helpers under `lib/supabase/`; keep browser clients on the publishable/anon key.
- Never expose a Supabase secret/service-role key or a PostgreSQL connection string to browser code. Any `NEXT_PUBLIC_` variable is public.
- Keep database credentials in ignored local `.env.local` or deployment secret settings. Never commit secrets, print them in logs, or ask users to paste them into chat.
- Apply Row Level Security to tables in exposed schemas and write policies that authorize the specific user's rows; authentication alone is not authorization.
- For schema changes, use reviewed migrations. Validate SQL and access policies before applying to production.
- Use the PostgreSQL best-practices skill in this directory when designing schemas, indexes, queries, pooling, or RLS.
