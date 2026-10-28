import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { members } from "@/lib/db/schema";
import { memberSchema } from "@/lib/validations";

export async function GET() {
  try {
    await ensureDbInitialized();
    const allMembers = await db.select().from(members).all();
    return NextResponse.json(allMembers);
  } catch (error) {
    console.error("GET /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const validated = memberSchema.parse(body);

    const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newMember = {
      id,
      name: validated.name,
      role: validated.role,
      avatarColor: validated.avatarColor,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.insert(members).values(newMember);
    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("POST /api/members error:", error);
    return NextResponse.json(
      { error: "Failed to create member", details: (error as Error).message },
      { status: 400 }
    );
  }
}
