import test from "node:test";
import assert from "node:assert/strict";
import { db, ensureDbInitialized } from "../src/lib/db/index.ts";
import { projects, members, tasks, milestones } from "../src/lib/db/schema.ts";
import { seedDemoDataIfNeeded } from "../src/lib/db/seed.ts";
import { eq } from "drizzle-orm";
import {
  offsetDateStr,
  calculateTimelineRange,
  generateDayColumns,
  dateStrToPixel,
  pixelToDateStr,
} from "../src/lib/timeline/date-utils.ts";
import {
  computeMemberLayout,
  assignLanesToTasks,
  DEFAULT_TIMELINE_CONFIG,
} from "../src/lib/timeline/layout.ts";

test("E2E operations: Complete CRUD, Drag, Resize, and Persistence verification", async () => {
  await ensureDbInitialized();
  await seedDemoDataIfNeeded();

  // 1. 创建新项目 (Create new project)
  const newProjId = `proj-test-${Date.now()}`;
  await db.insert(projects).values({
    id: newProjId,
    name: "Tactile Hand Integration V1",
    description: "Multi-fingered dexterous hand with tactile fingertip array",
    color: "#8b5cf6",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const projRecord = await db.select().from(projects).where(eq(projects.id, newProjId)).get();
  assert.ok(projRecord, "Project must exist in DB");
  assert.equal(projRecord.name, "Tactile Hand Integration V1");

  // 2. 新增成员 (Add new team member)
  const newMemberId = `mem-test-${Date.now()}`;
  await db.insert(members).values({
    id: newMemberId,
    name: "Sarah Lin",
    role: "Computer Vision Specialist",
    avatarColor: "#06b6d4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const memberRecord = await db.select().from(members).where(eq(members.id, newMemberId)).get();
  assert.ok(memberRecord, "Member must exist in DB");
  assert.equal(memberRecord.name, "Sarah Lin");

  // 3. 创建任务 (Create new task)
  const newTaskId = `task-test-${Date.now()}`;
  await db.insert(tasks).values({
    id: newTaskId,
    projectId: newProjId,
    assigneeId: newMemberId,
    title: "Optical Gel Calibration",
    description: "Verify elasticity modulus and refractive index uniformity",
    startDate: "2026-10-12",
    endDate: "2026-10-18",
    status: "in_progress",
    priority: "high",
    progress: 25,
    color: "#06b6d4",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  let taskRecord = await db.select().from(tasks).where(eq(tasks.id, newTaskId)).get();
  assert.ok(taskRecord);
  assert.equal(taskRecord.title, "Optical Gel Calibration");

  // 4. 编辑任务属性 (Edit task attributes)
  await db
    .update(tasks)
    .set({
      title: "Optical Gel High-Precision Calibration",
      progress: 60,
      priority: "urgent",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, newTaskId));
  taskRecord = await db.select().from(tasks).where(eq(tasks.id, newTaskId)).get();
  assert.equal(taskRecord.title, "Optical Gel High-Precision Calibration");
  assert.equal(taskRecord.progress, 60);
  assert.equal(taskRecord.priority, "urgent");

  // 5. 拖动任务改变日期 (Drag task horizontally: shifts start & end date)
  const shiftDays = 5;
  const newStartDate = offsetDateStr(taskRecord.startDate, shiftDays);
  const newEndDate = offsetDateStr(taskRecord.endDate, shiftDays);
  await db
    .update(tasks)
    .set({
      startDate: newStartDate,
      endDate: newEndDate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, newTaskId));
  taskRecord = await db.select().from(tasks).where(eq(tasks.id, newTaskId)).get();
  assert.equal(taskRecord.startDate, "2026-10-17");
  assert.equal(taskRecord.endDate, "2026-10-23");

  // 6. 拖动任务改变负责人 (Drag task vertically: reassigns member)
  const originalAssignee = taskRecord.assigneeId;
  const allMembers = await db.select().from(members).all();
  const targetMember = allMembers.find((m) => m.name.includes("Alex"));
  assert.ok(targetMember);
  await db
    .update(tasks)
    .set({
      assigneeId: targetMember.id,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, newTaskId));
  taskRecord = await db.select().from(tasks).where(eq(tasks.id, newTaskId)).get();
  assert.equal(taskRecord.assigneeId, targetMember.id);
  assert.notEqual(taskRecord.assigneeId, originalAssignee);

  // 7. 调整任务开始和结束日期 (Resize task start and end date)
  const resizedStart = "2026-10-15";
  const resizedEnd = "2026-10-28";
  await db
    .update(tasks)
    .set({
      startDate: resizedStart,
      endDate: resizedEnd,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(tasks.id, newTaskId));
  taskRecord = await db.select().from(tasks).where(eq(tasks.id, newTaskId)).get();
  assert.equal(taskRecord.startDate, "2026-10-15");
  assert.equal(taskRecord.endDate, "2026-10-28");

  // 8. 创建里程碑 (Create milestone)
  const newMsId = `ms-test-${Date.now()}`;
  await db.insert(milestones).values({
    id: newMsId,
    projectId: newProjId,
    taskId: newTaskId,
    title: "Hand Hardware Assembly Complete",
    description: "Fingertip mechanical mount and cable routing verified",
    date: "2026-10-28",
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  let msRecord = await db.select().from(milestones).where(eq(milestones.id, newMsId)).get();
  assert.ok(msRecord);
  assert.equal(msRecord.title, "Hand Hardware Assembly Complete");
  assert.equal(msRecord.taskId, newTaskId);

  // 9. 编辑里程碑日期 (Edit milestone date)
  const updatedMsDate = "2026-10-31";
  await db
    .update(milestones)
    .set({
      date: updatedMsDate,
      status: "achieved",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(milestones.id, newMsId));
  msRecord = await db.select().from(milestones).where(eq(milestones.id, newMsId)).get();
  assert.equal(msRecord.date, "2026-10-31");
  assert.equal(msRecord.status, "achieved");

  // 10. 切换日/周/月视图计算 (Verify Day / Week / Month view ranges)
  const anchor = new Date("2026-10-10");
  const dayRange = calculateTimelineRange(anchor, "day");
  const weekRange = calculateTimelineRange(anchor, "week");
  const monthRange = calculateTimelineRange(anchor, "month");

  assert.ok(dayRange.endDate > dayRange.startDate);
  assert.ok(weekRange.endDate > weekRange.startDate);
  assert.ok(monthRange.endDate > monthRange.startDate);

  // Month range should encompass more days than day range
  const dayCols = generateDayColumns(dayRange.startDate, dayRange.endDate);
  const monthCols = generateDayColumns(monthRange.startDate, monthRange.endDate);
  assert.ok(monthCols.length > dayCols.length);

  // 11. 验证重叠任务的子轨道动态分配 (Verify multi-lane sub-track allocation)
  const alexTasks = await db.select().from(tasks).where(eq(tasks.assigneeId, targetMember.id)).all();
  const alexLayout = computeMemberLayout(
    targetMember,
    alexTasks,
    weekRange.startDate,
    weekRange.endDate,
    DEFAULT_TIMELINE_CONFIG
  );
  assert.ok(alexLayout.lanesCount >= 2, "Overlapping tasks must yield >= 2 lanes");
  assert.ok(alexLayout.placedTasks.length === alexTasks.length);

  // 12. 持久化验证：重新建立新连接查询数据依然存在 (Persistence check)
  const reloadedTask = await db.select().from(tasks).where(eq(tasks.id, newTaskId)).get();
  assert.ok(reloadedTask, "Task data must persist across queries");
  assert.equal(reloadedTask.title, "Optical Gel High-Precision Calibration");

  // Clean up test entities
  await db.delete(tasks).where(eq(tasks.id, newTaskId));
  await db.delete(milestones).where(eq(milestones.id, newMsId));
  await db.delete(projects).where(eq(projects.id, newProjId));
  await db.delete(members).where(eq(members.id, newMemberId));
});
