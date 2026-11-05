import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB || "therapture");
    const notes = await db.collection("notes").find({}).sort({ createdAt: -1 }).limit(50).toArray();
    return NextResponse.json(notes.map(({ _id, ...note }) => ({ id: _id.toString(), ...note })));
  } catch {
    return NextResponse.json({ error: "MongoDB is not configured or could not be reached." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || !("title" in body) || typeof body.title !== "string") {
      return NextResponse.json({ error: "Provide a title as a string." }, { status: 400 });
    }
    const title = body.title.trim();
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Title must be between 1 and 200 characters." }, { status: 400 });
    }

    const client = await getMongoClient();
    const result = await client.db(process.env.MONGODB_DB || "therapture").collection("notes").insertOne({
      title,
      createdAt: new Date(),
    });
    return NextResponse.json({ id: result.insertedId.toString(), title }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "MongoDB is not configured or could not be reached." }, { status: 503 });
  }
}
