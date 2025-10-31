import clsx from "clsx";
import type { KanbanBoard, KanbanTicket, KanbanUser } from "@opendock/shared/types";
import { formatTicketKey, priorityAccent, priorityStyles } from "@/lib/ticketStyles";

export interface TicketCardProps {
  ticket: KanbanTicket;
  column?: KanbanBoard["columns"][number];
  members: KanbanUser[];
  sprints: KanbanBoard["sprints"];
  onClick?: () => void;
  highlight?: boolean;
  className?: string;
}

export function TicketCard({
  ticket,
  column,
  members,
  sprints,
  onClick,
  highlight = false,
  className,
}: TicketCardProps) {
  const assignee = members.find((member) => ticket.assigneeIds.includes(member.id));
  const sprint = sprints.find((item) => item.id === ticket.sprintId);
  const isComplete =
    column?.title.toLowerCase().includes("done") || column?.title.toLowerCase().includes("complete");

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group relative flex flex-col gap-2 rounded-lg border bg-white p-3 pl-5 text-neutral-700 transition-[transform,box-shadow,border-color] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:bg-neutral-950 dark:text-neutral-200",
        isComplete
          ? "border-emerald-500 bg-emerald-50/50 hover:border-emerald-600 dark:border-emerald-400 dark:bg-emerald-950/20 dark:hover:border-emerald-300"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800",
        highlight && "ring-2 ring-blue-400/30 dark:ring-blue-500/30",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx("absolute inset-y-2 left-2 w-1 rounded-full", priorityAccent[ticket.priority])}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">
            {formatTicketKey(ticket)}
          </p>
          <p className="text-sm font-medium text-neutral-900 dark:text-white">{ticket.title}</p>
        </div>
        {ticket.estimate ? (
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-white/10 dark:text-neutral-300">
            {ticket.estimate} pts
          </span>
        ) : null}
      </div>
      {ticket.description ? (
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{ticket.description}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
        <span className={clsx("rounded-md px-2 py-1", priorityStyles[ticket.priority])}>{ticket.priority}</span>
        {sprint ? (
          <span className="rounded-md border border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-500 dark:border-neutral-700 dark:text-neutral-300">
            {sprint.name}
          </span>
        ) : (
          <span className="rounded-md border border-dashed border-neutral-200 px-2 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-700 dark:text-neutral-500">
            Backlog
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-white">
            {(assignee?.name ?? "UN").slice(0, 2).toUpperCase()}
          </span>
          <div>
            <p className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-200">
              {assignee ? assignee.name : "Unassigned"}
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">Assignee</p>
          </div>
        </div>
        {ticket.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500">
            {ticket.tags.map((tag) => (
              <span key={tag} className="rounded-md border border-neutral-200 px-2 py-0.5 dark:border-neutral-700">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
