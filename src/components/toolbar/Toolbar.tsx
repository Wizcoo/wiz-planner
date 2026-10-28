"use client";

import React from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { format, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Users,
  Sun,
  Moon,
  Flag,
  ZoomIn,
  ZoomOut,
  Calendar as CalendarIcon,
} from "lucide-react";
import { ViewMode } from "@/lib/timeline/types";

export function Toolbar() {
  const {
    projects,
    members,
    selectedProjectId,
    viewMode,
    setViewMode,
    anchorDate,
    setAnchorDate,
    columnWidth,
    setColumnWidth,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    memberFilter,
    setMemberFilter,
    openNewTaskModal,
    openNewMilestoneModal,
    theme,
    toggleTheme,
  } = useTimelineStore();

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const handlePrev = () => {
    const offset = viewMode === "day" ? -7 : viewMode === "week" ? -21 : -30;
    setAnchorDate(addDays(anchorDate, offset));
  };

  const handleNext = () => {
    const offset = viewMode === "day" ? 7 : viewMode === "week" ? 21 : 30;
    setAnchorDate(addDays(anchorDate, offset));
  };

  const handleToday = () => {
    setAnchorDate(new Date());
  };

  const dateHeading = `${anchorDate.getFullYear()}年 ${anchorDate.getMonth() + 1}月`;

  const viewModeLabels: Record<ViewMode, string> = {
    day: "日视图",
    week: "周视图",
    month: "月视图",
  };

  return (
    <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* Left: Project title & Navigation */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-2 border-r border-neutral-200 dark:border-neutral-800">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: currentProject?.color || "#0071e3" }}
          />
          <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 max-w-[200px] truncate">
            {currentProject ? currentProject.name : "所有项目"}
          </span>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition shadow-sm"
          >
            今天
          </button>
          <div className="w-[1px] h-3.5 bg-neutral-200 dark:bg-neutral-700" />
          <button
            onClick={handlePrev}
            title="上一时间周期"
            className="p-1 text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            title="下一时间周期"
            className="p-1 text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 rounded-md transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight">
          {dateHeading}
        </div>
      </div>

      {/* Middle: macOS Segmented Control (Day / Week / Month) & Zoom */}
      <div className="flex items-center gap-3">
        {/* macOS Segmented Picker */}
        <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 shadow-inner">
          {(["day", "week", "month"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 ${
                viewMode === mode
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-mac"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
            >
              {viewModeLabels[mode]}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200/60 dark:border-neutral-700/60">
          <button
            onClick={() => setColumnWidth(columnWidth - 6)}
            title="缩小网格刻度"
            className="p-0.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <input
            type="range"
            min="20"
            max="80"
            value={columnWidth}
            onChange={(e) => setColumnWidth(Number(e.target.value))}
            className="w-16 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <button
            onClick={() => setColumnWidth(columnWidth + 6)}
            title="放大网格刻度"
            className="p-0.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Right: Search, Filters & Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索任务或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1 w-36 lg:w-44 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-800 transition"
          />
        </div>

        {/* Assignee Filter */}
        <select
          value={memberFilter || ""}
          onChange={(e) => setMemberFilter(e.target.value || null)}
          className="text-xs py-1 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">全部成员</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || null)}
          className="text-xs py-1 px-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
        >
          <option value="">全部状态</option>
          <option value="todo">待办 (To Do)</option>
          <option value="in_progress">进行中 (In Progress)</option>
          <option value="review">评审中 (Review)</option>
          <option value="done">已完成 (Done)</option>
        </select>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="切换浅色 / 深色外观"
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 transition"
        >
          {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>

        {/* New Milestone Button */}
        <button
          onClick={openNewMilestoneModal}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition shadow-sm"
        >
          <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="hidden sm:inline">里程碑</span>
        </button>

        {/* New Task Button (Apple Blue Pill) */}
        <button
          onClick={() => openNewTaskModal()}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建任务</span>
        </button>
      </div>
    </header>
  );
}
