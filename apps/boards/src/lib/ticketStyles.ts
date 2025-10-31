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
