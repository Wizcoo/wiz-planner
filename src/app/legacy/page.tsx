"use client";

import React, { useEffect } from "react";
import { useTimelineStore } from "@/lib/store/timeline-store";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ResourceTimeline } from "@/components/timeline/ResourceTimeline";
import { TaskDrawer } from "@/components/drawer/TaskDrawer";
import { NewTaskModal } from "@/components/modals/NewTaskModal";
import { NewMilestoneModal } from "@/components/modals/NewMilestoneModal";
import { NewProjectModal } from "@/components/modals/NewProjectModal";
import { NewMemberModal } from "@/components/modals/NewMemberModal";
import { ToastContainer } from "@/components/ui/Toast";

export default function Home() {
  const { fetchData } = useTimelineStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#fbfbfd] dark:bg-[#121214] text-neutral-900 dark:text-neutral-100 font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        <Toolbar />
        <ResourceTimeline />
      </main>

      {/* 3. Task Inspector Drawer */}
      <TaskDrawer />

      {/* 4. Modals */}
      <NewTaskModal />
      <NewMilestoneModal />
      <NewProjectModal />
      <NewMemberModal />

      {/* 5. Toasts */}
      <ToastContainer />
    </div>
  );
}
