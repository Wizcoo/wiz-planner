"use client";

import React, { useState, useEffect } from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { formatDateOnly } from "@/lib/timeline/date-utils";
import { X, Flag, Trash2, Calendar, Folder } from "lucide-react";
import { addDays } from "date-fns";

export function NewMilestoneModal() {
  const {
    isNewMilestoneModalOpen,
    closeNewMilestoneModal,
    selectedMilestoneId,
    milestones,
    tasks,
    projects,
    selectedProjectId,
    createMilestone,
    updateMilestone,
    deleteMilestone,
  } = useTimelineStore();

  const isEditing = Boolean(selectedMilestoneId);
  const activeMilestone = milestones.find((m) => m.id === selectedMilestoneId);

  const todayStr = formatDateOnly(new Date());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState<string>("");
  const [date, setDate] = useState(todayStr);
  const [status, setStatus] = useState<"pending" | "achieved">("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isNewMilestoneModalOpen) {
      if (activeMilestone) {
        setTitle(activeMilestone.title);
        setDescription(activeMilestone.description || "");
        setProjectId(activeMilestone.projectId);
        setTaskId(activeMilestone.taskId || "");
        setDate(activeMilestone.date);
        setStatus(activeMilestone.status as any);
      } else {
        setTitle("");
        setDescription("");
        setProjectId(selectedProjectId || (projects[0]?.id ?? ""));
        setTaskId("");
        setDate(formatDateOnly(addDays(new Date(), 14)));
        setStatus("pending");
      }
    }
  }, [isNewMilestoneModalOpen, activeMilestone, selectedProjectId, projects]);

  if (!isNewMilestoneModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !date) return;

    setIsSubmitting(true);
    let success = false;
    if (isEditing && activeMilestone) {
      success = await updateMilestone(activeMilestone.id, {
        title: title.trim(),
        description: description.trim() || null,
        projectId,
        taskId: taskId || null,
        date,
        status,
      });
    } else {
      success = await createMilestone({
        title: title.trim(),
        description: description.trim() || null,
        projectId,
        taskId: taskId || null,
        date,
        status,
      });
    }
    setIsSubmitting(false);

    if (success) {
      closeNewMilestoneModal();
    }
  };

  const handleDelete = async () => {
    if (!activeMilestone) return;
    await deleteMilestone(activeMilestone.id);
    closeNewMilestoneModal();
  };

  const projectTasks = tasks.filter((t) => t.projectId === projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-2xl shadow-mac-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              {isEditing ? "编辑关键里程碑" : "新建关键里程碑"}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                title="删除里程碑"
                className="p-1 rounded text-neutral-400 hover:text-rose-500 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeNewMilestoneModal}
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              里程碑名称 *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 算法核心基线达成"
              className="px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              交付验收准则
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="说明关键交付节点与验收指标..."
              className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
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
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                <Calendar className="w-3 h-3" /> 目标达成日期
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px]">
                达成状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="pending">待达成 (Pending)</option>
                <option value="achieved">已达成 (Achieved)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-semibold text-neutral-500 uppercase text-[10px]">
                关联任务 (可选)
              </label>
              <select
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">不关联具体任务</option>
                {projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <button
              type="button"
              onClick={closeNewMilestoneModal}
              className="px-3.5 py-1.5 rounded-lg font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg font-medium text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 transition shadow-sm"
            >
              {isSubmitting ? "正在保存..." : isEditing ? "保存修改" : "立即创建里程碑"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
