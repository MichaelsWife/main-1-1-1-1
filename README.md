# The Rapture — Starter App

A small Next.js app with ready-to-configure Supabase and MongoDB connections.

## Run locally

1. Install Node.js 20 or newer.
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your service credentials.
4. Start the app: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000).

The home page checks both connections. Supabase is checked through its Auth health endpoint; MongoDB is checked with a ping command.

## Configure services

- **Supabase:** In your Supabase project settings, copy the Project URL and the publishable/anon key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The browser client helper is at `lib/supabase/client.ts`.
- **MongoDB:** Copy your connection string into `MONGODB_URI` and optionally set `MONGODB_DB` (defaults to `therapture`). The MongoDB driver helper is at `lib/mongodb.ts`.

A MongoDB example API is included:

- `GET /api/notes` — list up to 50 notes.
- `POST /api/notes` — create a note with JSON such as `{"title":"My first note"}`.

## Security notes

- Never put your MongoDB connection string or a Supabase `service_role`/secret key in a `NEXT_PUBLIC_` variable. Keep secrets in `.env.local` or your hosting provider's server-side environment settings.
- The Supabase anon/publishable key is intended for client-side use, but secure your tables with Row Level Security (RLS) policies before storing data.
- The included notes endpoint is a starter example; add authentication and authorization before using it with private or production data.
