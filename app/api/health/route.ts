import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

async function checkSupabase(): Promise<"connected" | "not_configured" | "error"> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "not_configured";

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? "connected" : "error";
  } catch {
    return "error";
  }
}

async function checkMongoDB(): Promise<"connected" | "not_configured" | "error"> {
  if (!process.env.MONGODB_URI) return "not_configured";
  try {
    const client = await getMongoClient();
    await client.db(process.env.MONGODB_DB || "therapture").command({ ping: 1 });
    return "connected";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [supabase, mongodb] = await Promise.all([checkSupabase(), checkMongoDB()]);
  return NextResponse.json({ supabase, mongodb });
}
