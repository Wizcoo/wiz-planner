"use client";

import React, { useState, useEffect } from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { formatDateOnly } from "@/lib/timeline/date-utils";
import { X, Calendar, User, Folder } from "lucide-react";
import { addDays } from "date-fns";

export function NewTaskModal() {
  const {
    isNewTaskModalOpen,
    closeNewTaskModal,
    newTaskInitialData,
    createTask,
    projects,
    members,
    selectedProjectId,
  } = useTimelineStore();

  const todayStr = formatDateOnly(new Date());
  const nextWeekStr = formatDateOnly(addDays(new Date(), 7));

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextWeekStr);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = useState<"todo" | "in_progress" | "review" | "done">("in_progress");
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("#0071e3");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isNewTaskModalOpen) {
      setTitle("");
      setDescription("");
      setProjectId(newTaskInitialData?.projectId || selectedProjectId || (projects[0]?.id ?? ""));
      setAssigneeId(newTaskInitialData?.assigneeId || (members[0]?.id ?? ""));
      setStartDate(newTaskInitialData?.startDate || todayStr);
      setEndDate(newTaskInitialData?.endDate || nextWeekStr);
      setPriority("medium");
      setStatus("in_progress");
      setProgress(0);
      setColor("#0071e3");
    }
  }, [isNewTaskModalOpen, newTaskInitialData, selectedProjectId, projects, members, todayStr, nextWeekStr]);

  if (!isNewTaskModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !assigneeId) return;

    setIsSubmitting(true);
    const success = await createTask({
      title: title.trim(),
      description: description.trim() || null,
      projectId,
      assigneeId,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      priority,
      status,
      progress,
      color,
    });
    setIsSubmitting(false);

    if (success) {
      closeNewTaskModal();
    }
  };

  const colorsList = ["#0071e3", "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-2xl shadow-mac-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              新建研发排期任务
            </h3>
          </div>
          <button
            onClick={closeNewTaskModal}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              任务名称 *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: Mark点中心提取与Voronoi分割"
              className="px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              任务描述与交付说明
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="说明任务目标、技术参数、验收准则或依赖项..."
              className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px] flex items-center gap-1">
                <Folder className="w-3 h-3" /> 所属项目
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px] flex items-center gap-1">
                <User className="w-3 h-3" /> 负责人
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 起始日期
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px] flex items-center gap-1">
                <Calendar className="w-3 h-3" /> 截止日期
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px]">
                优先级
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="low">低 (Low)</option>
                <option value="medium">中 (Medium)</option>
                <option value="high">高 (High)</option>
                <option value="urgent">紧急 (Urgent)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px]">
                初始状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todo">待办 (To Do)</option>
                <option value="in_progress">进行中 (In Progress)</option>
                <option value="review">评审中 (In Review)</option>
                <option value="done">已完成 (Done)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              分类标签颜色
            </label>
            <div className="flex items-center gap-2">
              {colorsList.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    color === c ? "ring-2 ring-blue-500 ring-offset-2 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <button
              type="button"
              onClick={closeNewTaskModal}
              className="px-3.5 py-1.5 rounded-lg font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition shadow-sm"
            >
              {isSubmitting ? "正在创建..." : "立即创建任务"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
