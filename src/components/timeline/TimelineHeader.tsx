"use client";

import React from "react";
import { DayColumnInfo, MilestoneLayout } from "@/lib/timeline/types";
import { MilestoneMarker } from "./MilestoneMarker";
import { Flag, Users } from "lucide-react";

interface TimelineHeaderProps {
  dayColumns: DayColumnInfo[];
  columnWidth: number;
  totalWidth: number;
  timelineStartDate: Date;
  milestonesLayout: MilestoneLayout[];
}

export function TimelineHeader({
  dayColumns,
  columnWidth,
  totalWidth,
  timelineStartDate,
  milestonesLayout,
}: TimelineHeaderProps) {
  // Group days by Month for the top row
  const monthGroups: { monthName: string; year: number; startIndex: number; count: number }[] = [];
  dayColumns.forEach((col, idx) => {
    const last = monthGroups[monthGroups.length - 1];
    if (!last || last.monthName !== col.monthName || last.year !== col.year) {
      monthGroups.push({
        monthName: col.monthName,
        year: col.year,
        startIndex: idx,
        count: 1,
      });
    } else {
      last.count += 1;
    }
  });

  return (
    <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col">
      {/* 1. Month Bar */}
      <div className="flex border-b border-neutral-200/80 dark:border-neutral-800/80 h-7 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
        {/* Sticky Member Column Header */}
        <div className="sticky left-0 z-40 w-60 min-w-[240px] px-4 flex items-center gap-2 bg-[#f5f5f7] dark:bg-[#161618] border-r border-neutral-200 dark:border-neutral-800">
          <Users className="w-3.5 h-3.5 text-neutral-400" />
          <span className="uppercase tracking-wider text-[10px]">团队成员与职能</span>
        </div>

        {/* Month Header Spans */}
        <div className="relative flex" style={{ width: `${totalWidth}px` }}>
          {monthGroups.map((group, idx) => (
            <div
              key={`${group.monthName}-${group.year}-${idx}`}
              style={{
                left: `${group.startIndex * columnWidth}px`,
                width: `${group.count * columnWidth}px`,
              }}
              className="absolute top-0 bottom-0 px-3 flex items-center border-r border-neutral-200/60 dark:border-neutral-800/60 font-medium text-neutral-700 dark:text-neutral-300 truncate"
            >
              {group.year}年 {group.monthName}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Days & Weekdays Bar */}
      <div className="flex border-b border-neutral-200/80 dark:border-neutral-800/80 h-9 text-[11px]">
        {/* Sticky Left Corner */}
        <div className="sticky left-0 z-40 w-60 min-w-[240px] px-4 flex items-center text-[10px] text-neutral-400 font-medium bg-[#f5f5f7] dark:bg-[#161618] border-r border-neutral-200 dark:border-neutral-800">
          <span>排期与工作量</span>
        </div>

        {/* Day Columns */}
        <div className="relative flex" style={{ width: `${totalWidth}px` }}>
          {dayColumns.map((col, idx) => (
            <div
              key={col.dateStr}
              style={{
                left: `${idx * columnWidth}px`,
                width: `${columnWidth}px`,
              }}
              className={`absolute top-0 bottom-0 flex flex-col items-center justify-center border-r border-neutral-100 dark:border-neutral-800/50 ${
                col.isWeekend
                  ? "bg-neutral-100/60 dark:bg-neutral-900/60 text-neutral-400"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              <span className="text-[9px] font-medium">{col.dayNameZh}</span>
              <span
                className={`text-xs font-semibold leading-tight ${
                  col.isToday
                    ? "w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
                    : ""
                }`}
              >
                {col.dayOfMonth}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Milestones Track */}
      <div className="flex h-7 bg-amber-50/40 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 text-[11px]">
        {/* Sticky Left Milestone Label */}
        <div className="sticky left-0 z-40 w-60 min-w-[240px] px-4 flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium text-[10px] uppercase tracking-wider bg-amber-100/50 dark:bg-amber-950/40 border-r border-neutral-200 dark:border-neutral-800">
          <Flag className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span>关键里程碑</span>
          <span className="ml-auto text-[10px] bg-amber-200/60 dark:bg-amber-900/60 px-1 rounded-full font-mono">
            {milestonesLayout.length}
          </span>
        </div>

        {/* Milestone Diamond Markers Area */}
        <div className="relative" style={{ width: `${totalWidth}px` }}>
          {/* Subtle vertical day guidelines */}
          {milestonesLayout.map((layout) => (
            <MilestoneMarker
              key={layout.milestone.id}
              milestone={layout.milestone}
              leftPx={layout.leftPx}
              columnWidth={columnWidth}
              timelineStartDate={timelineStartDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
