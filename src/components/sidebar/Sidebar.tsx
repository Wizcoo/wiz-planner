"use client";

import React from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import {
  Calendar,
  Layers,
  Users,
  Flag,
  Settings,
  FolderPlus,
  UserPlus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export function Sidebar() {
  const {
    projects,
    members,
    selectedProjectId,
    setSelectedProjectId,
    isSidebarCollapsed,
    toggleSidebar,
    openNewProjectModal,
    openNewMemberModal,
    resetDemoData,
    tasks,
    milestones,
  } = useTimelineStore();

  if (isSidebarCollapsed) {
    return (
      <aside className="w-12 h-screen border-r border-neutral-200 dark:border-neutral-800 bg-[#fbfbfd] dark:bg-[#121214] flex flex-col items-center py-4 justify-between select-none shrink-0 transition-all duration-200">
        <button
          onClick={toggleSidebar}
          title="Expand Sidebar"
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
            W
          </div>
        </div>
        <div className="text-[10px] text-neutral-400">v1.0</div>
      </aside>
    );
  }

  return (
    <aside className="w-64 h-screen border-r border-neutral-200 dark:border-neutral-800 bg-[#f5f5f7] dark:bg-[#161618] flex flex-col justify-between select-none shrink-0 transition-all duration-200">
      {/* Top Header */}
      <div className="flex flex-col">
        {/* Workspace Brand Bar */}
        <div className="px-4 py-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              W
            </div>
            <div>
              <div className="font-semibold text-xs text-neutral-800 dark:text-neutral-100 tracking-tight">
                Wiz Timeline
              </div>
              <div className="text-[10px] text-neutral-400 font-medium">
                团队资源排期看板
              </div>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            title="收起侧边栏"
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 flex flex-col gap-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            工作区概览
          </div>

          <button
            onClick={() => setSelectedProjectId(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedProjectId === null
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>所有项目时间轴</span>
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedProjectId === null
                  ? "bg-blue-700 text-white"
                  : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {tasks.length}
            </span>
          </button>
        </div>

        {/* Projects List */}
        <div className="px-3 py-1 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              项目列表 ({projects.length})
            </span>
            <button
              onClick={openNewProjectModal}
              title="新建项目"
              className="p-0.5 rounded text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-0.5 mt-1 max-h-48 overflow-y-auto">
            {projects.map((proj) => {
              const isSelected = selectedProjectId === proj.id;
              const projectTaskCount = tasks.filter((t) => t.projectId === proj.id).length;
              return (
                <button
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-mac border border-neutral-200/60 dark:border-neutral-700"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono ml-1">
                    {projectTaskCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Members Summary */}
        <div className="px-3 py-2 flex flex-col">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              团队成员 ({members.length})
            </span>
            <button
              onClick={openNewMemberModal}
              title="添加成员"
              className="p-0.5 rounded text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 mt-1 max-h-44 overflow-y-auto">
            {members.map((mem) => {
              const memTasks = tasks.filter((t) => t.assigneeId === mem.id);
              const doneCount = memTasks.filter((t) => t.status === "done").length;
              return (
                <div
                  key={mem.id}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                      style={{ backgroundColor: mem.avatarColor }}
                    >
                      {mem.name.charAt(0)}
                    </div>
                    <span className="truncate font-medium">{mem.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {doneCount}/{memTasks.length} 完成
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / Reset & Settings */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 flex flex-col gap-2">
        <button
          onClick={resetDemoData}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/50 dark:bg-neutral-800/50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>重置演示数据</span>
        </button>
        <div className="flex items-center justify-between px-1 text-[10px] text-neutral-400">
          <span>本地 SQLite • macOS 风格</span>
          <span className="font-mono">5-30人研发团队</span>
        </div>
      </div>
    </aside>
  );
}
