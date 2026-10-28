import {
  format,
  addDays,
  differenceInCalendarDays,
  isWeekend as fnsIsWeekend,
  isToday as fnsIsToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import type { DayColumnInfo, ViewMode } from "./types";

/**
 * Parse YYYY-MM-DD strictly into a local Date at 00:00:00 to prevent timezone drift.
 */
export function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    const fallback = new Date();
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Format local Date into YYYY-MM-DD.
 */
export function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Difference in calendar days between two YYYY-MM-DD strings (B - A).
 */
export function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = parseDateOnly(dateStrA);
  const b = parseDateOnly(dateStrB);
  return differenceInCalendarDays(b, a);
}

/**
 * Offset a YYYY-MM-DD string by a given number of days.
 */
export function offsetDateStr(dateStr: string, offsetDays: number): string {
  const date = parseDateOnly(dateStr);
  const newDate = addDays(date, offsetDays);
  return formatDateOnly(newDate);
}

/**
 * Calculate the timeline date range based on viewMode and an anchor date.
 * Ensures the start of the week is Monday.
 */
export function calculateTimelineRange(
  anchorDate: Date = new Date(),
  viewMode: ViewMode = "week"
): { startDate: Date; endDate: Date } {
  // Start week on Monday (weekStartsOn: 1)
  const currentWeekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });

  switch (viewMode) {
    case "day": {
      // Show ~30 days: 7 days before anchor week, 28 days forward
      const start = addDays(currentWeekStart, -7);
      const end = addDays(start, 42);
      return { startDate: start, endDate: end };
    }
    case "week": {
      // Show ~10 weeks: 3 weeks before, 8 weeks forward
      const start = addDays(currentWeekStart, -21);
      const end = addDays(start, 77); // 11 weeks = 77 days
      return { startDate: start, endDate: end };
    }
    case "month": {
      // Show ~4 months: 1 month before, 3 months forward
      const start = startOfWeek(startOfMonth(subMonths(anchorDate, 1)), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(addMonths(anchorDate, 3)), { weekStartsOn: 1 });
      return { startDate: start, endDate: end };
    }
    default:
      return {
        startDate: addDays(currentWeekStart, -14),
        endDate: addDays(currentWeekStart, 70),
      };
  }
}

/**
 * Generates an array of day metadata objects for the grid columns.
 */
export function generateDayColumns(startDate: Date, endDate: Date): DayColumnInfo[] {
  const columns: DayColumnInfo[] = [];
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;

  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const dateStr = formatDateOnly(date);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday

    const ZH_WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

    columns.push({
      date,
      dateStr,
      dayOfMonth: date.getDate(),
      dayOfWeek,
      dayName: format(date, "EEE"), // Mon, Tue...
      dayNameZh: ZH_WEEKDAYS[dayOfWeek], // 日, 一, 二...
      monthName: format(date, "MMM"), // Oct, Nov...
      monthNameZh: `${date.getFullYear()}年${date.getMonth() + 1}月`, // 2026年10月
      year: date.getFullYear(),
      isWeekend: fnsIsWeekend(date),
      isToday: fnsIsToday(date),
      isFirstDayOfWeek: dayOfWeek === 1, // Monday
      isFirstDayOfMonth: date.getDate() === 1,
    });
  }

  return columns;
}

/**
 * Compute the default column width for different views.
 */
export function getDefaultColumnWidth(viewMode: ViewMode): number {
  switch (viewMode) {
    case "day":
      return 60; // wide column for day view
    case "week":
      return 36; // balanced density
    case "month":
      return 24; // high overview density
    default:
      return 36;
  }
}

/**
 * Snaps pixel offset to nearest day index and returns the date string.
 */
export function pixelToDateStr(
  pixelOffset: number,
  timelineStartDate: Date,
  columnWidth: number
): string {
  const dayIndex = Math.round(pixelOffset / columnWidth);
  const targetDate = addDays(timelineStartDate, dayIndex);
  return formatDateOnly(targetDate);
}

/**
 * Computes pixel left position of a given date relative to timeline start date.
 */
export function dateStrToPixel(
  dateStr: string,
  timelineStartDate: Date,
  columnWidth: number
): number {
  const date = parseDateOnly(dateStr);
  const diffDays = differenceInCalendarDays(date, timelineStartDate);
  return diffDays * columnWidth;
}
