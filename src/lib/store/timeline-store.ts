import { create } from "zustand";
import { Project, Member, Task, Milestone } from "../db/schema";
import { ViewMode } from "../timeline/types";
import { getDefaultColumnWidth } from "../timeline/date-utils";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface TimelineStore {
  // Data
  projects: Project[];
  members: Member[];
  tasks: Task[];
  milestones: Milestone[];
  isLoading: boolean;
  error: string | null;

  // View state
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  selectedMilestoneId: string | null;
  viewMode: ViewMode;
  columnWidth: number;
  anchorDate: Date;
  searchQuery: string;
  statusFilter: string | null;
  memberFilter: string | null;
  isSidebarCollapsed: boolean;
  theme: "light" | "dark";

  // Modals & Panels
  isTaskDrawerOpen: boolean;
  isNewTaskModalOpen: boolean;
  newTaskInitialData: Partial<Task> | null;
  isNewMilestoneModalOpen: boolean;
  isNewProjectModalOpen: boolean;
  isNewMemberModalOpen: boolean;

  // Feedback
  toasts: ToastItem[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;

  // Actions
  fetchData: () => Promise<void>;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedMilestoneId: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setColumnWidth: (width: number) => void;
  setAnchorDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string | null) => void;
  setMemberFilter: (memberId: string | null) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  openNewTaskModal: (initialData?: Partial<Task>) => void;
  closeNewTaskModal: () => void;
  openNewMilestoneModal: () => void;
  closeNewMilestoneModal: () => void;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;
  openNewMemberModal: () => void;
  closeNewMemberModal: () => void;
  closeTaskDrawer: () => void;

  // CRUD Actions
  createTask: (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;

  createMilestone: (data: Omit<Milestone, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<boolean>;
  deleteMilestone: (id: string) => Promise<boolean>;

  createProject: (data: { name: string; description?: string; color?: string }) => Promise<boolean>;
  createMember: (data: { name: string; role: string; avatarColor?: string }) => Promise<boolean>;
  resetDemoData: () => Promise<void>;
}

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  projects: [],
  members: [],
  tasks: [],
  milestones: [],
  isLoading: true,
  error: null,

  selectedProjectId: null,
  selectedTaskId: null,
  selectedMilestoneId: null,
  viewMode: "week",
  columnWidth: getDefaultColumnWidth("week"),
  anchorDate: new Date(),
  searchQuery: "",
  statusFilter: null,
  memberFilter: null,
  isSidebarCollapsed: false,
  theme: "light",

  isTaskDrawerOpen: false,
  isNewTaskModalOpen: false,
  newTaskInitialData: null,
  isNewMilestoneModalOpen: false,
  isNewProjectModalOpen: false,
  isNewMemberModalOpen: false,

  toasts: [],

  addToast: (message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [projRes, memRes, taskRes, msRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/members"),
        fetch("/api/tasks"),
        fetch("/api/milestones"),
      ]);

      if (!projRes.ok || !memRes.ok || !taskRes.ok || !msRes.ok) {
        throw new Error("Failed to fetch timeline data");
      }

      const projectsData: Project[] = await projRes.json();
      const membersData: Member[] = await memRes.json();
      const tasksData: Task[] = await taskRes.json();
      const milestonesData: Milestone[] = await msRes.json();

      set({
        projects: projectsData,
        members: membersData,
        tasks: tasksData,
        milestones: milestonesData,
        selectedProjectId: projectsData.length > 0 ? projectsData[0].id : null,
        isLoading: false,
      });
    } catch (err) {
      console.error(err);
      set({ error: (err as Error).message, isLoading: false });
      get().addToast("Failed to load timeline data", "error");
    }
  },

  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedTaskId: (id) =>
    set({
      selectedTaskId: id,
      isTaskDrawerOpen: id !== null,
    }),
  setSelectedMilestoneId: (id) => set({ selectedMilestoneId: id }),

  setViewMode: (mode) =>
    set({
      viewMode: mode,
      columnWidth: getDefaultColumnWidth(mode),
    }),

  setColumnWidth: (width) => set({ columnWidth: Math.max(18, Math.min(120, width)) }),
  setAnchorDate: (date) => set({ anchorDate: date }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setMemberFilter: (memberId) => set({ memberFilter: memberId }),

  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),

  toggleTheme: () => {
    const current = get().theme;
    const next = current === "light" ? "dark" : "light";
    if (typeof document !== "undefined") {
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme: next });
  },

  openNewTaskModal: (initialData) =>
    set({
      isNewTaskModalOpen: true,
      newTaskInitialData: initialData ?? null,
    }),
  closeNewTaskModal: () =>
    set({
      isNewTaskModalOpen: false,
      newTaskInitialData: null,
    }),

  openNewMilestoneModal: () => set({ isNewMilestoneModalOpen: true }),
  closeNewMilestoneModal: () =>
    set({
      isNewMilestoneModalOpen: false,
      selectedMilestoneId: null,
    }),

  openNewProjectModal: () => set({ isNewProjectModalOpen: true }),
  closeNewProjectModal: () => set({ isNewProjectModalOpen: false }),

  openNewMemberModal: () => set({ isNewMemberModalOpen: true }),
  closeNewMemberModal: () => set({ isNewMemberModalOpen: false }),

  closeTaskDrawer: () => set({ isTaskDrawerOpen: false, selectedTaskId: null }),

  // CRUD Operations with Optimistic updates
  createTask: async (taskData) => {
    const tempId = `temp-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: tempId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Optimistic insert
    set((s) => ({ tasks: [...s.tasks, newTask] }));

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "Failed to create task");
      }

      const created: Task = await res.json();
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === tempId ? created : t)),
      }));
      get().addToast(`任务“${created.title}”创建成功`, "success");
      return true;
    } catch (err) {
      // Rollback
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== tempId) }));
      get().addToast((err as Error).message || "创建任务失败", "error");
      return false;
    }
  },

  updateTask: async (id, updates) => {
    const originalTasks = get().tasks;
    const taskIndex = originalTasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) return false;

    const originalTask = originalTasks[taskIndex];
    const optimisticTask: Task = { ...originalTask, ...updates, updatedAt: new Date().toISOString() };

    // Optimistic update
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? optimisticTask : t)),
    }));

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "更新任务失败");
      }

      const updated: Task = await res.json();
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
      }));
      return true;
    } catch (err) {
      // Rollback
      set({ tasks: originalTasks });
      get().addToast((err as Error).message || "更新任务失败", "error");
      return false;
    }
  },

  deleteTask: async (id) => {
    const originalTasks = get().tasks;
    const task = originalTasks.find((t) => t.id === id);
    if (!task) return false;

    // Optimistic delete
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      isTaskDrawerOpen: s.selectedTaskId === id ? false : s.isTaskDrawerOpen,
      selectedTaskId: s.selectedTaskId === id ? null : s.selectedTaskId,
    }));

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "删除任务失败");
      }
      get().addToast(`任务“${task.title}”已删除`, "success");
      return true;
    } catch (err) {
      // Rollback
      set({ tasks: originalTasks });
      get().addToast((err as Error).message || "删除任务失败", "error");
      return false;
    }
  },

  createMilestone: async (data) => {
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "创建里程碑失败");
      }

      const created: Milestone = await res.json();
      set((s) => ({ milestones: [...s.milestones, created] }));
      get().addToast(`里程碑“${created.title}”创建成功`, "success");
      return true;
    } catch (err) {
      get().addToast((err as Error).message || "创建里程碑失败", "error");
      return false;
    }
  },

  updateMilestone: async (id, updates) => {
    const originalMilestones = get().milestones;
    const ms = originalMilestones.find((m) => m.id === id);
    if (!ms) return false;

    const optimistic: Milestone = { ...ms, ...updates, updatedAt: new Date().toISOString() };
    set((s) => ({
      milestones: s.milestones.map((m) => (m.id === id ? optimistic : m)),
    }));

    try {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "更新里程碑失败");
      }

      const updated: Milestone = await res.json();
      set((s) => ({
        milestones: s.milestones.map((m) => (m.id === id ? updated : m)),
      }));
      return true;
    } catch (err) {
      set({ milestones: originalMilestones });
      get().addToast((err as Error).message || "更新里程碑失败", "error");
      return false;
    }
  },

  deleteMilestone: async (id) => {
    const original = get().milestones;
    const ms = original.find((m) => m.id === id);
    if (!ms) return false;

    set((s) => ({
      milestones: s.milestones.filter((m) => m.id !== id),
      selectedMilestoneId: s.selectedMilestoneId === id ? null : s.selectedMilestoneId,
    }));

    try {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "删除里程碑失败");
      }
      get().addToast(`里程碑“${ms.title}”已移除`, "success");
      return true;
    } catch (err) {
      set({ milestones: original });
      get().addToast((err as Error).message || "删除里程碑失败", "error");
      return false;
    }
  },

  createProject: async (data) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "创建项目失败");
      }

      const created: Project = await res.json();
      set((s) => ({
        projects: [...s.projects, created],
        selectedProjectId: created.id,
      }));
      get().addToast(`项目“${created.name}”已创建`, "success");
      return true;
    } catch (err) {
      get().addToast((err as Error).message || "创建项目失败", "error");
      return false;
    }
  },

  createMember: async (data) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "添加成员失败");
      }

      const created: Member = await res.json();
      set((s) => ({ members: [...s.members, created] }));
      get().addToast(`团队成员“${created.name}”已添加`, "success");
      return true;
    } catch (err) {
      get().addToast((err as Error).message || "添加成员失败", "error");
      return false;
    }
  },

  resetDemoData: async () => {
    try {
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      if (!res.ok) throw new Error("重置演示数据失败");
      get().addToast("演示数据已重置为最新状态", "success");
      await get().fetchData();
    } catch (err) {
      get().addToast((err as Error).message || "重置失败", "error");
    }
  },
}));
