"use client";

import React, { useState, useRef } from "react";
import { Milestone } from "@/lib/db/schema";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { offsetDateStr, parseDateOnly } from "@/lib/timeline/date-utils";
import { Flag, CheckCircle, Clock } from "lucide-react";

interface MilestoneMarkerProps {
  milestone: Milestone;
  leftPx: number;
  columnWidth: number;
  timelineStartDate: Date;
}

export function MilestoneMarker({
  milestone,
  leftPx,
  columnWidth,
  timelineStartDate,
}: MilestoneMarkerProps) {
  const { updateMilestone, setSelectedMilestoneId, openNewMilestoneModal } =
    useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const startXRef = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    setDragOffsetPx(deltaX);
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const deltaDays = Math.round(dragOffsetPx / columnWidth);
    setDragOffsetPx(0);

    if (deltaDays !== 0) {
      const newDate = offsetDateStr(milestone.date, deltaDays);
      await updateMilestone(milestone.id, { date: newDate });
    }
  };

  const currentLeft = leftPx + dragOffsetPx;

  return (
    <div
      style={{ left: `${currentLeft}px` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        e.stopPropagation();
        if (Math.abs(dragOffsetPx) < 5) {
          setSelectedMilestoneId(milestone.id);
          openNewMilestoneModal();
        }
      }}
      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 group cursor-grab active:cursor-grabbing select-none transition-transform ${
        isDragging ? "scale-125 z-40" : "hover:scale-115"
      }`}
    >
      {/* Diamond Shape */}
      <div
        className={`w-5 h-5 rotate-45 rounded-sm flex items-center justify-center shadow-mac transition-colors ${
          milestone.status === "achieved"
            ? "bg-emerald-500 text-white border border-emerald-600"
            : "bg-amber-500 text-white border border-amber-600"
        }`}
      >
        <div className="-rotate-45">
          <Flag className="w-2.5 h-2.5 fill-current" />
        </div>
      </div>

      {/* Hover Card / Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 top-7 hidden group-hover:flex flex-col bg-neutral-900/95 dark:bg-neutral-800/95 backdrop-blur-md text-white text-[11px] px-3 py-2 rounded-lg shadow-mac-lg whitespace-nowrap z-50 pointer-events-none border border-neutral-700/60 animate-fade-in">
        <div className="flex items-center gap-1.5 font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              milestone.status === "achieved" ? "bg-emerald-400" : "bg-amber-400"
            }`}
          />
          <span>{milestone.title}</span>
        </div>
        <div className="text-[10px] text-neutral-300 mt-0.5">
          目标日期: {milestone.date} • {milestone.status === "achieved" ? "已达成" : "待完成"}
        </div>
        {milestone.description && (
          <div className="text-[10px] text-neutral-400 mt-1 max-w-[200px] truncate">
            {milestone.description}
          </div>
        )}
      </div>
    </div>
  );
}
