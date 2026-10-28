"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import {
  calculateTimelineRange,
  generateDayColumns,
  dateStrToPixel,
  formatDateOnly,
} from "@/lib/timeline/date-utils";
import { computeMemberLayout, computeMilestonesLayout } from "@/lib/timeline/layout";
import { TimelineHeader } from "./TimelineHeader";
import { MemberRow } from "./MemberRow";

export function ResourceTimeline() {
  const {
    projects,
    members,
    tasks,
    milestones,
    selectedProjectId,
    viewMode,
    columnWidth,
    anchorDate,
    searchQuery,
    statusFilter,
    memberFilter,
    isLoading,
  } = useTimelineStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Compute timeline date range and day columns
  const { startDate, endDate } = useMemo(
    () => calculateTimelineRange(anchorDate, viewMode),
    [anchorDate, viewMode]
  );

  const dayColumns = useMemo(
    () => generateDayColumns(startDate, endDate),
    [startDate, endDate]
  );

  const totalWidth = dayColumns.length * columnWidth;

  // 2. Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Project filter
      if (selectedProjectId && task.projectId !== selectedProjectId) {
        return false;
      }
      // Status filter
      if (statusFilter && task.status !== statusFilter) {
        return false;
      }
      // Member filter
      if (memberFilter && task.assigneeId !== memberFilter) {
        return false;
      }
      // Search query (matches title or description)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = (task.description || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, statusFilter, memberFilter, searchQuery]);

  // 3. Filter members
  const visibleMembers = useMemo(() => {
    if (memberFilter) {
      return members.filter((m) => m.id === memberFilter);
    }
    return members;
  }, [members, memberFilter]);

  // 4. Compute layout for each member
  const memberLayouts = useMemo(() => {
    return visibleMembers.map((member) => {
      const memberTasks = filteredTasks.filter((t) => t.assigneeId === member.id);
      return computeMemberLayout(
        member,
        memberTasks,
        startDate,
        endDate,
        {
          columnWidth,
          viewMode,
          taskHeight: 32,
          taskGap: 6,
          minRowHeight: 64,
          rowHeaderWidth: 240,
        }
      );
    });
  }, [visibleMembers, filteredTasks, startDate, endDate, columnWidth, viewMode]);

  // 5. Filter milestones and compute their layout
  const filteredMilestones = useMemo(() => {
    return milestones.filter((ms) => {
      if (selectedProjectId && ms.projectId !== selectedProjectId) {
        return false;
      }
      return true;
    });
  }, [milestones, selectedProjectId]);

  const milestonesLayout = useMemo(() => {
    return computeMilestonesLayout(filteredMilestones, startDate, endDate, columnWidth);
  }, [filteredMilestones, startDate, endDate, columnWidth]);

  // 6. Today Marker Pixel Position
  const todayStr = formatDateOnly(new Date());
  const todayLeftPx = useMemo(() => {
    const foundCol = dayColumns.find((c) => c.isToday);
    if (!foundCol) return null;
    return dateStrToPixel(todayStr, startDate, columnWidth) + columnWidth / 2;
  }, [dayColumns, todayStr, startDate, columnWidth]);

  // Auto-scroll to today or center on mount / view change
  useEffect(() => {
    if (todayLeftPx !== null && scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = Math.max(0, todayLeftPx - containerWidth / 2 + 120);
    }
  }, [anchorDate, viewMode]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#121214]">
        <div className="flex flex-col items-center gap-3 text-neutral-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">正在加载研发排期看板...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-auto relative bg-white dark:bg-[#121214] select-none"
    >
      <div className="min-w-max flex flex-col relative">
        {/* Sticky Header */}
        <TimelineHeader
          dayColumns={dayColumns}
          columnWidth={columnWidth}
          totalWidth={totalWidth}
          timelineStartDate={startDate}
          milestonesLayout={milestonesLayout}
        />

        {/* Member Rows */}
        <div className="flex flex-col relative">
          {/* Vertical Today Line */}
          {todayLeftPx !== null && (
            <div
              style={{ left: `${todayLeftPx + 240}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 pointer-events-none"
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-[3px] -mt-1 shadow-sm" />
            </div>
          )}

          {memberLayouts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
              <span className="text-sm font-medium">未找到符合当前筛选条件的团队成员。</span>
            </div>
          ) : (
            memberLayouts.map((layout) => (
              <MemberRow
                key={layout.member.id}
                layout={layout}
                dayColumns={dayColumns}
                columnWidth={columnWidth}
                totalWidth={totalWidth}
                timelineStartDate={startDate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
