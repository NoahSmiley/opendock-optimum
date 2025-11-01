import type { KanbanTicket } from "@opendock/shared/types";

export const priorityStyles: Record<KanbanTicket["priority"], string> = {
  high: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  medium: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
};

export const priorityAccent: Record<KanbanTicket["priority"], string> = {
  high: "bg-rose-500 dark:bg-rose-400",
  medium: "bg-amber-400 dark:bg-amber-300",
  low: "bg-emerald-400 dark:bg-emerald-300",
};

export const formatTicketKey = (ticket: KanbanTicket) => {
  const [prefix] = ticket.id.split("-");
  return prefix ? prefix.toUpperCase() : ticket.id.slice(0, 6).toUpperCase();
};

// Due date utilities
export type DueDateStatus = "overdue" | "due-soon" | "upcoming" | "none";

export const getDueDateStatus = (dueDate?: string): DueDateStatus => {
  if (!dueDate) return "none";

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "due-soon";
  return "upcoming";
};

export const dueDateBadgeStyles: Record<DueDateStatus, string> = {
  overdue: "bg-red-500/10 text-red-700 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
  "due-soon": "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
  upcoming: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  none: "",
};

export const formatDueDate = (dueDate: string): string => {
  const date = new Date(dueDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // If overdue
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return "Due today";
    if (absDays === 1) return "1 day overdue";
    return `${absDays} days overdue`;
  }

  // If due soon
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays} days`;

  // Otherwise show formatted date
  return `Due ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
};

// Time tracking utilities
export const formatDuration = (seconds: number): string => {
  if (seconds === 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
};

export const formatDurationLong = (seconds: number): string => {
  if (seconds === 0) return "0 seconds";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  if (secs > 0) parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);

  return parts.join(", ");
};

export const calculateTimeProgress = (timeSpent?: number, estimate?: number): number => {
  if (!estimate || estimate === 0) return 0;
  if (!timeSpent) return 0;

  // Convert estimate from points to hours (assuming 1 point = 1 hour)
  const estimateSeconds = estimate * 3600;
  return Math.min((timeSpent / estimateSeconds) * 100, 100);
};
