"use client";

import React, { useState } from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { X, UserPlus } from "lucide-react";

export function NewMemberModal() {
  const { isNewMemberModalOpen, closeNewMemberModal, createMember } =
    useTimelineStore();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarColor, setAvatarColor] = useState("#3b82f6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNewMemberModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    setIsSubmitting(true);
    const success = await createMember({
      name: name.trim(),
      role: role.trim(),
      avatarColor,
    });
    setIsSubmitting(false);

    if (success) {
      setName("");
      setRole("");
      closeNewMemberModal();
    }
  };

  const avatarColors = [
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#f43f5e",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-2xl shadow-mac-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
              添加团队成员
            </h3>
          </div>
          <button
            onClick={closeNewMemberModal}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              成员姓名 *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 林工 (Sarah Lin)"
              className="px-3 py-2 text-sm rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              专业角色 / 职能 *
            </label>
            <input
              type="text"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="例如: 机器视觉算法工程师 / SLAM专家"
              className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-neutral-500 uppercase text-[10px]">
              头像专属标识色
            </label>
            <div className="flex items-center gap-2">
              {avatarColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    avatarColor === c ? "ring-2 ring-blue-500 ring-offset-2 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200/80 dark:border-neutral-800/80">
            <button
              type="button"
              onClick={closeNewMemberModal}
              className="px-3.5 py-1.5 rounded-lg font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition shadow-sm"
            >
              {isSubmitting ? "正在添加..." : "确认添加成员"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
