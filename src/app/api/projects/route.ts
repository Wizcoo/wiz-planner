import { NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { projectSchema } from "@/lib/validations";
import { seedDemoDataIfNeeded } from "@/lib/db/seed";

export async function GET() {
  try {
    await ensureDbInitialized();
    await seedDemoDataIfNeeded(); // Auto-seed on first fetch if empty!
    const allProjects = await db.select().from(projects).all();
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await ensureDbInitialized();
    const body = await req.json();
    const validated = projectSchema.parse(body);

    const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const newProject = {
      id,
      name: validated.name,
      description: validated.description || null,
      color: validated.color,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.insert(projects).values(newProject);
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project", details: (error as Error).message },
      { status: 400 }
    );
  }
}
