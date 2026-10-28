import { NextResponse } from "next/server";
import { seedDemoDataIfNeeded } from "@/lib/db/seed";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await seedDemoDataIfNeeded(body.force === true);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
