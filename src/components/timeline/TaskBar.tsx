"use client";

import React, { useState, useRef } from "react";
import { Task } from "@/lib/db/schema";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { offsetDateStr, parseDateOnly } from "@/lib/timeline/date-utils";
import { Clock, CheckCircle2, AlertCircle, CircleDot } from "lucide-react";

interface TaskBarProps {
  task: Task;
  leftPx: number;
  widthPx: number;
  topPx: number;
  columnWidth: number;
  timelineStartDate: Date;
  onDragStartAssignee?: (taskId: string, startY: number) => void;
}

export function TaskBar({
  task,
  leftPx,
  widthPx,
  topPx,
  columnWidth,
  timelineStartDate,
}: TaskBarProps) {
  const { setSelectedTaskId, updateTask } = useTimelineStore();

  // Drag states
  const [dragMode, setDragMode] = useState<"none" | "move" | "resize-left" | "resize-right">("none");
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const [dragDeltaY, setDragDeltaY] = useState(0);
  const [targetAssigneeId, setTargetAssigneeId] = useState<string | null>(null);

  const startPointerRef = useRef({ x: 0, y: 0 });
  const initialDatesRef = useRef({ start: task.startDate, end: task.endDate });

  // Handle main bar pointer down (Move Task)
  const handleMovePointerDown = (e: React.PointerEvent) => {
    // Only left click
    if (e.button !== 0) return;
    e.stopPropagation();

    setDragMode("move");
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    initialDatesRef.current = { start: task.startDate, end: task.endDate };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Handle Resize pointer down
  const handleResizePointerDown = (
    mode: "resize-left" | "resize-right",
    e: React.PointerEvent
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    setDragMode(mode);
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    initialDatesRef.current = { start: task.startDate, end: task.endDate };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === "none") return;

    const deltaX = e.clientX - startPointerRef.current.x;
    const deltaY = e.clientY - startPointerRef.current.y;
    setDragDeltaX(deltaX);
    setDragDeltaY(deltaY);

    if (dragMode === "move" && Math.abs(deltaY) > 15) {
      // Find element below cursor to determine new assignee
      const elementsUnder = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of elementsUnder) {
        const memberRowId = el.getAttribute("data-member-id");
        if (memberRowId && memberRowId !== task.assigneeId) {
          setTargetAssigneeId(memberRowId);
          break;
        }
      }
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (dragMode === "none") return;

    const currentMode = dragMode;
    const deltaX = dragDeltaX;
    const destAssigneeId = targetAssigneeId;

    setDragMode("none");
    setDragDeltaX(0);
    setDragDeltaY(0);
    setTargetAssigneeId(null);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    // If small click without significant drag, open drawer!
    if (Math.abs(deltaX) < 4 && Math.abs(dragDeltaY) < 4) {
      setSelectedTaskId(task.id);
      return;
    }

    const deltaDays = Math.round(deltaX / columnWidth);

    if (currentMode === "move") {
      let newStart = task.startDate;
      let newEnd = task.endDate;
      if (deltaDays !== 0) {
        newStart = offsetDateStr(task.startDate, deltaDays);
        newEnd = offsetDateStr(task.endDate, deltaDays);
      }

      const updates: Partial<Task> = {};
      if (deltaDays !== 0) {
        updates.startDate = newStart;
        updates.endDate = newEnd;
      }
      if (destAssigneeId && destAssigneeId !== task.assigneeId) {
        updates.assigneeId = destAssigneeId;
      }

      if (Object.keys(updates).length > 0) {
        await updateTask(task.id, updates);
      }
    } else if (currentMode === "resize-left") {
      if (deltaDays !== 0) {
        const potentialStart = offsetDateStr(task.startDate, deltaDays);
        if (potentialStart <= task.endDate) {
          await updateTask(task.id, { startDate: potentialStart });
        }
      }
    } else if (currentMode === "resize-right") {
      if (deltaDays !== 0) {
        const potentialEnd = offsetDateStr(task.endDate, deltaDays);
        if (potentialEnd >= task.startDate) {
          await updateTask(task.id, { endDate: potentialEnd });
        }
      }
    }
  };

  // Compute live visual coordinates during drag
  let visualLeft = leftPx;
  let visualWidth = widthPx;
  let visualTop = topPx;

  if (dragMode === "move") {
    visualLeft = leftPx + dragDeltaX;
    visualTop = topPx + dragDeltaY;
  } else if (dragMode === "resize-left") {
    const rawLeft = leftPx + dragDeltaX;
    const maxWidth = leftPx + widthPx - columnWidth;
    visualLeft = Math.min(rawLeft, maxWidth);
    visualWidth = widthPx - (visualLeft - leftPx);
  } else if (dragMode === "resize-right") {
    visualWidth = Math.max(columnWidth - 4, widthPx + dragDeltaX);
  }

  // Preview dates
  const daysOffset = Math.round(dragDeltaX / columnWidth);
  const previewStart =
    dragMode === "move" || dragMode === "resize-left"
      ? offsetDateStr(task.startDate, daysOffset)
      : task.startDate;
  const previewEnd =
    dragMode === "move" || dragMode === "resize-right"
      ? offsetDateStr(task.endDate, daysOffset)
      : task.endDate;

  const isDragging = dragMode !== "none";

  // Status visual colors
  const statusStyles: Record<string, string> = {
    done: "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    in_progress: "border-blue-500/60 bg-blue-500/10 text-blue-900 dark:text-blue-100",
    review: "border-purple-500/60 bg-purple-500/10 text-purple-900 dark:text-purple-100",
    todo: "border-neutral-400/60 bg-neutral-500/10 text-neutral-800 dark:text-neutral-200",
  };

  const priorityBadge: Record<string, string> = {
    urgent: "bg-rose-500",
    high: "bg-amber-500",
    medium: "bg-blue-500",
    low: "bg-neutral-400",
  };

  const priorityLabels: Record<string, string> = {
    urgent: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };

  return (
    <div
      style={{
        left: `${visualLeft}px`,
        width: `${visualWidth}px`,
        top: `${visualTop}px`,
        height: "32px",
      }}
      onPointerDown={handleMovePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`group absolute rounded-lg border flex items-center select-none transition-[box-shadow] cursor-grab active:cursor-grabbing ${
        statusStyles[task.status] || statusStyles.in_progress
      } ${
        isDragging
          ? "z-50 shadow-mac-lg ring-2 ring-blue-500 ring-offset-1 opacity-90 scale-[1.01]"
          : "z-10 shadow-mac hover:shadow-md hover:z-20"
      }`}
    >
      {/* Background Progress Fill Bar */}
      <div
        className="absolute left-0 top-0 bottom-0 rounded-lg opacity-25 pointer-events-none transition-all duration-200"
        style={{
          width: `${task.progress}%`,
          backgroundColor: task.color || "#0071e3",
        }}
      />

      {/* Left Resize Handle */}
      <div
        onPointerDown={(e) => handleResizePointerDown("resize-left", e)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="拖拽以调整起始日期"
        className="absolute left-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/20 dark:hover:bg-white/20 rounded-l-lg z-30 transition-colors"
      />

      {/* Task Content */}
      <div className="flex items-center gap-1.5 px-2.5 w-full overflow-hidden pointer-events-none">
        {/* Priority indicator dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            priorityBadge[task.priority] || "bg-blue-500"
          }`}
          title={`优先级: ${priorityLabels[task.priority] || task.priority}`}
        />

        {/* Title */}
        <span className="text-xs font-semibold truncate tracking-tight">
          {task.title}
        </span>

        {/* Progress badge if space permits */}
        {visualWidth > 110 && (
          <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 ml-auto shrink-0 font-medium">
            {task.progress}%
          </span>
        )}
      </div>

      {/* Right Resize Handle */}
      <div
        onPointerDown={(e) => handleResizePointerDown("resize-right", e)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        title="拖拽以调整截止日期"
        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-ew-resize hover:bg-black/20 dark:hover:bg-white/20 rounded-r-lg z-30 transition-colors"
      />

      {/* Dragging Live Date Indicator Tooltip */}
      {isDragging && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900/95 dark:bg-neutral-800/95 text-white text-[10px] px-2 py-0.5 rounded shadow-mac-lg whitespace-nowrap pointer-events-none z-50 font-mono">
          {previewStart} → {previewEnd}
          {targetAssigneeId && " (重新指派成员)"}
        </div>
      )}
    </div>
  );
}
