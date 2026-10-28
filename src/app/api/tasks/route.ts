import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await ensureDbInitialized();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    let query = db.select().from(tasks);
    if (projectId) {
      // @ts-expect-error drizzle where builder
      query = query.where(eq(tasks.projectId, projectId));
    }

    const allTasks = await query.all();
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const validated = taskSchema.parse(body);

    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newTask = {
      id,
      projectId: validated.projectId,
      assigneeId: validated.assigneeId,
      title: validated.title,
      description: validated.description || null,
      startDate: validated.startDate,
      endDate: validated.endDate,
      status: validated.status,
      priority: validated.priority,
      progress: validated.progress,
      color: validated.color,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.insert(tasks).values(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task", details: (error as Error).message },
      { status: 400 }
    );
  }
}
