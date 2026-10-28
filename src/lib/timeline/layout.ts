import type { Task, Member, Milestone } from "../db/schema";
import type {
  MemberTimelineLayout,
  PlacedTaskLayout,
  MilestoneLayout,
  TimelineConfig,
} from "./types";
import { parseDateOnly, dateStrToPixel, daysBetween } from "./date-utils.ts";
import { differenceInCalendarDays } from "date-fns";

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  columnWidth: 36,
  viewMode: "week",
  taskHeight: 32,
  taskGap: 6,
  minRowHeight: 56,
  rowHeaderWidth: 240,
};

/**
 * Packs tasks assigned to a member into non-overlapping sub-tracks (lanes).
 * Uses interval scheduling greedy algorithm.
 */
export function assignLanesToTasks(tasks: Task[]): {
  taskLanes: Map<string, number>;
  totalLanes: number;
} {
  const taskLanes = new Map<string, number>();
  if (tasks.length === 0) {
    return { taskLanes, totalLanes: 1 };
  }

  // Sort tasks by start date ascending, then longer duration first
  const sorted = [...tasks].sort((a, b) => {
    if (a.startDate !== b.startDate) {
      return a.startDate.localeCompare(b.startDate);
    }
    const durA = daysBetween(a.startDate, a.endDate);
    const durB = daysBetween(b.startDate, b.endDate);
    return durB - durA;
  });

  // Array of lanes, where each lane stores the end dates (inclusive) of placed tasks
  const lanesEndDates: string[] = [];

  for (const task of sorted) {
    let placed = false;
    for (let i = 0; i < lanesEndDates.length; i++) {
      // If task starts strictly after the last placed task in this lane
      // (inclusive date-only: if previous ended on YYYY-MM-05, new task can start on YYYY-MM-06 or later)
      if (task.startDate > lanesEndDates[i]) {
        taskLanes.set(task.id, i);
        lanesEndDates[i] = task.endDate;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Allocate new lane
      const newLaneIndex = lanesEndDates.length;
      taskLanes.set(task.id, newLaneIndex);
      lanesEndDates.push(task.endDate);
    }
  }

  return {
    taskLanes,
    totalLanes: Math.max(1, lanesEndDates.length),
  };
}

/**
 * Computes exact pixel coordinates for each task of a member on the timeline.
 */
export function computeMemberLayout(
  member: Member,
  memberTasks: Task[],
  timelineStartDate: Date,
  timelineEndDate: Date,
  config: TimelineConfig
): MemberTimelineLayout {
  const { taskLanes, totalLanes } = assignLanesToTasks(memberTasks);

  const topPadding = 10;
  const bottomPadding = 10;
  const contentHeight =
    topPadding +
    totalLanes * config.taskHeight +
    (totalLanes - 1) * config.taskGap +
    bottomPadding;
  const rowHeight = Math.max(config.minRowHeight, contentHeight);

  const placedTasks: PlacedTaskLayout[] = memberTasks.map((task) => {
    const laneIndex = taskLanes.get(task.id) ?? 0;
    const topPx =
      topPadding + laneIndex * (config.taskHeight + config.taskGap);

    const taskStartDate = parseDateOnly(task.startDate);
    const taskEndDate = parseDateOnly(task.endDate);

    const isClippedLeft = taskStartDate < timelineStartDate;
    const isClippedRight = taskEndDate > timelineEndDate;

    // Start pixel: difference from timelineStartDate * columnWidth
    const leftPx = dateStrToPixel(task.startDate, timelineStartDate, config.columnWidth);

    // Duration in days (inclusive, so end - start + 1)
    const durationDays = Math.max(
      1,
      differenceInCalendarDays(taskEndDate, taskStartDate) + 1
    );

    // Leave a 2px visual margin between adjacent columns
    const widthPx = Math.max(config.columnWidth - 4, durationDays * config.columnWidth - 4);

    return {
      task,
      laneIndex,
      leftPx,
      widthPx,
      topPx,
      durationDays,
      isClippedLeft,
      isClippedRight,
    };
  });

  return {
    member,
    lanesCount: totalLanes,
    rowHeight,
    placedTasks,
  };
}

/**
 * Computes milestone positions along the timeline header/track.
 */
export function computeMilestonesLayout(
  milestonesList: Milestone[],
  timelineStartDate: Date,
  timelineEndDate: Date,
  columnWidth: number
): MilestoneLayout[] {
  return milestonesList.map((ms) => {
    const msDate = parseDateOnly(ms.date);
    const isOutOfRange = msDate < timelineStartDate || msDate > timelineEndDate;
    // Position diamond centered in the day's column
    const leftPx = dateStrToPixel(ms.date, timelineStartDate, columnWidth) + columnWidth / 2;

    return {
      milestone: ms,
      leftPx,
      isOutOfRange,
    };
  });
}
