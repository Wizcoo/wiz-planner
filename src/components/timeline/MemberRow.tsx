"use client";

import React, { useState, useRef } from "react";
import { MemberTimelineLayout, DayColumnInfo } from "@/lib/timeline/types";
import { TaskBar } from "./TaskBar";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { pixelToDateStr } from "@/lib/timeline/date-utils";

interface MemberRowProps {
  layout: MemberTimelineLayout;
  dayColumns: DayColumnInfo[];
  columnWidth: number;
  totalWidth: number;
  timelineStartDate: Date;
}

export function MemberRow({
  layout,
  dayColumns,
  columnWidth,
  totalWidth,
  timelineStartDate,
}: MemberRowProps) {
  const { member, rowHeight, placedTasks } = layout;
  const { openNewTaskModal, selectedProjectId } = useTimelineStore();

  // Drag-to-create selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectStartPx, setSelectStartPx] = useState(0);
  const [selectCurrentPx, setSelectCurrentPx] = useState(0);
  const rowGridRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on empty row space with left click
    if (e.button !== 0 || (e.target as HTMLElement).closest(".group")) return;

    if (!rowGridRef.current) return;
    const rect = rowGridRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;

    setIsSelecting(true);
    setSelectStartPx(relativeX);
    setSelectCurrentPx(relativeX);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSelecting || !rowGridRef.current) return;
    const rect = rowGridRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    setSelectCurrentPx(relativeX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isSelecting) return;
    setIsSelecting(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    const minX = Math.min(selectStartPx, selectCurrentPx);
    const maxX = Math.max(selectStartPx, selectCurrentPx);
    const dragDistance = maxX - minX;

    // If dragged at least 1/2 of a column, treat as date range selection!
    if (dragDistance > columnWidth / 2) {
      const startDate = pixelToDateStr(minX, timelineStartDate, columnWidth);
      const endDate = pixelToDateStr(maxX, timelineStartDate, columnWidth);

      openNewTaskModal({
        assigneeId: member.id,
        projectId: selectedProjectId || undefined,
        startDate,
        endDate: endDate >= startDate ? endDate : startDate,
      });
    }
  };

  // Selection box geometry
  const selLeft = Math.min(selectStartPx, selectCurrentPx);
  const selWidth = Math.max(selectStartPx, selectCurrentPx) - selLeft;

  // Active / Done stats
  const totalTasks = placedTasks.length;
  const doneTasks = placedTasks.filter((p) => p.task.status === "done").length;
  const activeTasks = totalTasks - doneTasks;

  return (
    <div
      data-member-id={member.id}
      style={{ height: `${rowHeight}px` }}
      className="flex border-b border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-colors group/row"
    >
      {/* Sticky Left Member Card (240px) */}
      <div className="sticky left-0 z-20 w-60 min-w-[240px] px-3 py-2 flex items-center justify-between bg-white dark:bg-[#121214] border-r border-neutral-200 dark:border-neutral-800 select-none shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2.5 truncate">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: member.avatarColor }}
          >
            {member.name.charAt(0)}
          </div>

          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
              {member.name}
            </span>
            <span className="text-[10px] text-neutral-400 truncate">
              {member.role}
            </span>
          </div>
        </div>

        {/* Workload / Task count badge */}
        <div className="flex flex-col items-end shrink-0 pl-1">
          <span className="text-[10px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
            {activeTasks} 项进行中
          </span>
          <div className="w-12 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: totalTasks > 0 ? `${(doneTasks / totalTasks) * 100}%` : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Grid & Task Canvas */}
      <div
        ref={rowGridRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ width: `${totalWidth}px` }}
        className="relative h-full select-none cursor-crosshair overflow-hidden"
      >
        {/* Weekend Shading and Day Grid Lines */}
        {dayColumns.map((col, idx) => (
          <div
            key={col.dateStr}
            style={{
              left: `${idx * columnWidth}px`,
              width: `${columnWidth}px`,
            }}
            className={`absolute top-0 bottom-0 border-r border-neutral-100 dark:border-neutral-800/40 pointer-events-none ${
              col.isWeekend
                ? "bg-neutral-100/50 dark:bg-neutral-900/40"
                : col.isToday
                ? "bg-red-500/[0.03]"
                : ""
            }`}
          />
        ))}

        {/* Drag-to-Create Range Selection Box */}
        {isSelecting && selWidth > 4 && (
          <div
            style={{
              left: `${selLeft}px`,
              width: `${selWidth}px`,
              top: "6px",
              bottom: "6px",
            }}
            className="absolute rounded-lg border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none z-30 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300"
          >
            + 框选新建任务
          </div>
        )}

        {/* Placed Task Bars */}
        {placedTasks.map((placed) => (
          <TaskBar
            key={placed.task.id}
            task={placed.task}
            leftPx={placed.leftPx}
            widthPx={placed.widthPx}
            topPx={placed.topPx}
            columnWidth={columnWidth}
            timelineStartDate={timelineStartDate}
          />
        ))}
      </div>
    </div>
  );
}
