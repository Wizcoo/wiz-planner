import { Task, Member, Milestone, Project } from "../db/schema";

export type ViewMode = "day" | "week" | "month";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TimelineConfig {
  columnWidth: number; // Width of 1 day in pixels
  viewMode: ViewMode;
  taskHeight: number;
  taskGap: number;
  minRowHeight: number;
  rowHeaderWidth: number;
}

export interface PlacedTaskLayout {
  task: Task;
  laneIndex: number;
  leftPx: number;
  widthPx: number;
  topPx: number;
  durationDays: number;
  isClippedLeft: boolean;
  isClippedRight: boolean;
}

export interface MemberTimelineLayout {
  member: Member;
  lanesCount: number;
  rowHeight: number;
  placedTasks: PlacedTaskLayout[];
}

export interface MilestoneLayout {
  milestone: Milestone;
  leftPx: number;
  isOutOfRange: boolean;
}

export interface DayColumnInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;   // 'Mon', 'Tue', etc.
  dayNameZh: string; // '一', '二', etc.
  monthName: string; // 'Oct', 'Nov', etc.
  monthNameZh: string; // '10月', '11月', etc.
  year: number;
  isWeekend: boolean;
  isToday: boolean;
  isFirstDayOfWeek: boolean;
  isFirstDayOfMonth: boolean;
}

export interface FilterState {
  searchQuery: string;
  selectedProjectId: string | null;
  selectedAssigneeId: string | null;
  selectedStatus: string | null;
}
