"use client";

import React, { useState, useEffect } from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import {
  X,
  Trash2,
  Calendar,
  User,
  Folder,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flag,
} from "lucide-react";

export function TaskDrawer() {
  const {
    tasks,
    members,
    projects,
    milestones,
    selectedTaskId,
    isTaskDrawerOpen,
    closeTaskDrawer,
    updateTask,
    deleteTask,
  } = useTimelineStore();

  const task = tasks.find((t) => t.id === selectedTaskId);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "review" | "done">("in_progress");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("#0071e3");

  // Confirm delete dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setProjectId(task.projectId);
      setAssigneeId(task.assigneeId);
      setStartDate(task.startDate);
      setEndDate(task.endDate);
      setStatus(task.status as any);
      setPriority(task.priority as any);
      setProgress(task.progress);
      setColor(task.color || "#0071e3");
      setShowDeleteConfirm(false);
    }
  }, [task]);

  if (!isTaskDrawerOpen || !task) return null;

  // Auto-save on blur or change
  const handleSaveField = async (fieldUpdates: Record<string, any>) => {
    setIsSaving(true);
    await updateTask(task.id, fieldUpdates);
    setIsSaving(false);
  };

  const handleDelete = async () => {
    await deleteTask(task.id);
  };

  // Associated milestones for this task
  const relatedMilestones = milestones.filter((m) => m.taskId === task.id);

  const colorsList = [
    { name: "Blue", hex: "#0071e3" },
    { name: "Indigo", hex: "#6366f1" },
    { name: "Purple", hex: "#8b5cf6" },
    { name: "Cyan", hex: "#06b6d4" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Amber", hex: "#f59e0b" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Rose", hex: "#f43f5e" },
  ];

  return (
    <aside className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-[#1c1c1e] shadow-mac-drawer border-l border-neutral-200 dark:border-neutral-800 z-50 flex flex-col animate-slide-in-right select-none">
      {/* Header */}
      <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            任务属性检视器
          </span>
          {isSaving && (
            <span className="text-[10px] text-neutral-400 font-mono">正在保存...</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            title="删除任务"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={closeTaskDrawer}
            title="关闭抽屉"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {/* Title Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-neutral-500 uppercase">
            任务名称 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== task.title) {
                handleSaveField({ title: title.trim() });
              }
            }}
            className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Description Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-neutral-500 uppercase">
            详细描述
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (task.description || "")) {
                handleSaveField({ description });
              }
            }}
            placeholder="填写任务技术规范、验收准则或说明..."
            className="w-full px-3 py-2 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Project & Assignee */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase flex items-center gap-1">
              <Folder className="w-3 h-3" /> 所属项目
            </label>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                handleSaveField({ projectId: e.target.value });
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> 负责人
            </label>
            <select
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                handleSaveField({ assigneeId: e.target.value });
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates Range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 起始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                const val = e.target.value;
                setStartDate(val);
                if (val && val <= endDate) {
                  handleSaveField({ startDate: val });
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 截止日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                const val = e.target.value;
                setEndDate(val);
                if (val && val >= startDate) {
                  handleSaveField({ endDate: val });
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              状态
            </label>
            <select
              value={status}
              onChange={(e) => {
                const val = e.target.value as any;
                setStatus(val);
                handleSaveField({ status: val });
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="todo">待办 (To Do)</option>
              <option value="in_progress">进行中 (In Progress)</option>
              <option value="review">评审中 (In Review)</option>
              <option value="done">已完成 (Completed)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              优先级
            </label>
            <select
              value={priority}
              onChange={(e) => {
                const val = e.target.value as any;
                setPriority(val);
                handleSaveField({ priority: val });
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="low">低 (Low)</option>
              <option value="medium">中 (Medium)</option>
              <option value="high">高 (High)</option>
              <option value="urgent">紧急 (Urgent)</option>
            </select>
          </div>
        </div>

        {/* Progress Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase">
              完成进度
            </label>
            <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
              {progress}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => {
              const val = Number(e.target.value);
              setProgress(val);
            }}
            onMouseUp={() => handleSaveField({ progress })}
            onTouchEnd={() => handleSaveField({ progress })}
            className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Category Color Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-neutral-500 uppercase">
            分类标签颜色
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {colorsList.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => {
                  setColor(c.hex);
                  handleSaveField({ color: c.hex });
                }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c.hex
                    ? "ring-2 ring-blue-500 ring-offset-2 scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Associated Milestones */}
        {relatedMilestones.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <label className="text-[11px] font-semibold text-neutral-500 uppercase flex items-center gap-1">
              <Flag className="w-3 h-3 text-amber-500 fill-amber-500" /> 关联的关键里程碑
            </label>
            <div className="flex flex-col gap-1">
              {relatedMilestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-xs"
                >
                  <span className="font-medium text-amber-900 dark:text-amber-200">
                    {m.title}
                  </span>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                    目标: {m.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800/80 text-[10px] text-neutral-400 flex justify-between">
        <span>任务ID: {task.id.slice(0, 16)}</span>
        <span>已实时同步至本地 SQLite</span>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-mac-lg border border-neutral-200 dark:border-neutral-700 max-w-xs w-full flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-sm">确认删除任务？</span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              确定要永久删除任务“{task.title}”吗？此操作无法撤销。
            </p>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-500 transition"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
