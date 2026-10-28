import test from "node:test";
import assert from "node:assert/strict";
import { ensureDbInitialized, db } from "../src/lib/db/index.ts";
import { seedDemoDataIfNeeded } from "../src/lib/db/seed.ts";
import { projects, members, tasks, milestones } from "../src/lib/db/schema.ts";

test("db: initializes tables and seeds demo data", async () => {
  await ensureDbInitialized();
  const seedResult = await seedDemoDataIfNeeded();
  assert.ok(seedResult);

  const allProjects = await db.select().from(projects).all();
  assert.ok(allProjects.length >= 1);
  assert.ok(allProjects[0].name.includes("视触觉传感器"));

  const allMembers = await db.select().from(members).all();
  assert.ok(allMembers.length >= 5);
  const memberNames = allMembers.map((m) => m.name).sort();
  assert.ok(memberNames.some((n) => n.includes("Alex")));

  const allTasks = await db.select().from(tasks).all();
  assert.ok(allTasks.length >= 12, `Expected at least 12 tasks, got ${allTasks.length}`);

  const allMilestones = await db.select().from(milestones).all();
  assert.equal(allMilestones.length, 4);
});
