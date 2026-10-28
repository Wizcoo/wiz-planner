import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { milestones } from "@/lib/db/schema";
import { milestoneSchema } from "@/lib/validations";

export async function GET() {
  try {
    await ensureDbInitialized();
    const allMilestones = await db.select().from(milestones).all();
    return NextResponse.json(allMilestones);
  } catch (error) {
    console.error("GET /api/milestones error:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const validated = milestoneSchema.parse(body);

    const id = `ms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newMilestone = {
      id,
      projectId: validated.projectId,
      taskId: validated.taskId || null,
      title: validated.title,
      description: validated.description || null,
      date: validated.date,
      status: validated.status,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.insert(milestones).values(newMilestone);
    return NextResponse.json(newMilestone, { status: 201 });
  } catch (error) {
    console.error("POST /api/milestones error:", error);
    return NextResponse.json(
      { error: "Failed to create milestone", details: (error as Error).message },
      { status: 400 }
    );
  }
}
