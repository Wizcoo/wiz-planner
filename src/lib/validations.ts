import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().optional().default(""),
  color: z.string().default("#0071e3"),
});

export const memberSchema = z.object({
  name: z.string().min(1, "Member name is required").max(60),
  role: z.string().min(1, "Role is required").max(80),
  avatarColor: z.string().default("#3b82f6"),
});

export const baseTaskSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().min(1, "Assignee is required"),
  title: z.string().min(1, "Task title is required").max(200),
  description: z.string().optional().default(""),
  startDate: z.string().regex(dateRegex, "Invalid start date format (YYYY-MM-DD)"),
  endDate: z.string().regex(dateRegex, "Invalid end date format (YYYY-MM-DD)"),
  status: z.enum(["todo", "in_progress", "review", "done"]).default("in_progress"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  progress: z.number().int().min(0).max(100).default(0),
  color: z.string().default("#3b82f6"),
});

export const taskSchema = baseTaskSchema.refine(
  (data) => data.startDate <= data.endDate,
  {
    message: "End date must be on or after start date",
    path: ["endDate"],
  }
);

export const updateTaskSchema = baseTaskSchema.partial();

export const milestoneSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  taskId: z.string().nullable().optional(),
  title: z.string().min(1, "Milestone title is required").max(200),
  description: z.string().optional().default(""),
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  status: z.enum(["pending", "achieved"]).default("pending"),
});

export const updateMilestoneSchema = milestoneSchema.partial();
