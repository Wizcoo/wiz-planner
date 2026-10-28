import test from "node:test";
import assert from "node:assert/strict";
import { assignLanesToTasks } from "../src/lib/timeline/layout.ts";
import {
  parseDateOnly,
  formatDateOnly,
  daysBetween,
  offsetDateStr,
} from "../src/lib/timeline/date-utils.ts";

test("date-utils: parseDateOnly and formatDateOnly roundtrip correctly without timezone drift", () => {
  const dateStr = "2026-10-10";
  const date = parseDateOnly(dateStr);
  assert.equal(formatDateOnly(date), dateStr);
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 9); // October is 9 (0-indexed)
  assert.equal(date.getDate(), 10);
});

test("date-utils: daysBetween and offsetDateStr calculate accurately", () => {
  assert.equal(daysBetween("2026-10-10", "2026-10-20"), 10);
  assert.equal(daysBetween("2026-10-10", "2026-10-09"), -1);
  assert.equal(offsetDateStr("2026-10-10", 5), "2026-10-15");
  assert.equal(offsetDateStr("2026-10-10", -10), "2026-09-30");
});

test("layout: assignLanesToTasks packs non-overlapping tasks into the same lane", () => {
  const dummyTasks = [
    { id: "t1", startDate: "2026-10-01", endDate: "2026-10-05" },
    { id: "t2", startDate: "2026-10-06", endDate: "2026-10-10" },
    { id: "t3", startDate: "2026-10-11", endDate: "2026-10-15" },
  ];

  const result = assignLanesToTasks(dummyTasks);
  assert.equal(result.totalLanes, 1);
  assert.equal(result.taskLanes.get("t1"), 0);
  assert.equal(result.taskLanes.get("t2"), 0);
  assert.equal(result.taskLanes.get("t3"), 0);
});

test("layout: assignLanesToTasks allocates sub-tracks for overlapping tasks", () => {
  const dummyTasks = [
    { id: "t1", startDate: "2026-10-01", endDate: "2026-10-10" },
    { id: "t2", startDate: "2026-10-05", endDate: "2026-10-15" }, // overlaps with t1
    { id: "t3", startDate: "2026-10-08", endDate: "2026-10-12" }, // overlaps with both t1 and t2
    { id: "t4", startDate: "2026-10-16", endDate: "2026-10-20" }, // starts after all
  ];

  const result = assignLanesToTasks(dummyTasks);
  // t1, t2, t3 overlap concurrently at 2026-10-08, so at least 3 lanes needed
  assert.equal(result.totalLanes, 3);
  assert.notEqual(result.taskLanes.get("t1"), result.taskLanes.get("t2"));
  assert.notEqual(result.taskLanes.get("t2"), result.taskLanes.get("t3"));
  assert.notEqual(result.taskLanes.get("t1"), result.taskLanes.get("t3"));
  // t4 can reuse lane 0 or 1 or 2
  assert.ok(result.taskLanes.get("t4") !== undefined);
});
