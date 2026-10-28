import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { milestones } from "@/lib/db/schema";
import { updateMilestoneSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;
    const body = await req.json();
    const validated = updateMilestoneSchema.parse(body);

    const nowIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      ...validated,
      updatedAt: nowIso,
    };

    await db.update(milestones).set(updateData).where(eq(milestones.id, id));

    const updated = await db.select().from(milestones).where(eq(milestones.id, id)).get();
    if (!updated) {
      return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/milestones/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update milestone", details: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;

    await db.delete(milestones).where(eq(milestones.id, id));
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/milestones/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone", details: (error as Error).message },
      { status: 500 }
    );
  }
}
