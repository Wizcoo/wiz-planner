import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { updateTaskSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();
    const { id } = await params;
    const body = await req.json();
    const validated = updateTaskSchema.parse(body);

    const nowIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      ...validated,
      updatedAt: nowIso,
    };

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));

    const updated = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (!updated) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update task", details: (error as Error).message },
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

    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete task", details: (error as Error).message },
      { status: 500 }
    );
  }
}
