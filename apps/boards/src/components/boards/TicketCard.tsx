import clsx from "clsx";
import { Check, Calendar } from "lucide-react";
import type { KanbanBoard, KanbanTicket, KanbanUser, KanbanLabel } from "@opendock/shared/types";
import { formatTicketKey, priorityAccent, priorityStyles, getDueDateStatus, dueDateBadgeStyles, formatDueDate } from "@/lib/ticketStyles";

export interface TicketCardProps {
  ticket: KanbanTicket;
  column?: KanbanBoard["columns"][number];
  members: KanbanUser[];
  labels: KanbanLabel[];
  sprints: KanbanBoard["sprints"];
  onClick?: () => void;
  highlight?: boolean;
  className?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (ticketId: string) => void;
}

export function TicketCard({
  ticket,
  column,
  members,
  labels = [],
  sprints,
  onClick,
  highlight = false,
  className,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TicketCardProps) {
  const assignee = members.find((member) => ticket.assigneeIds.includes(member.id));
  const sprint = sprints.find((item) => item.id === ticket.sprintId);
  const isComplete =
    column?.title.toLowerCase().includes("done") || column?.title.toLowerCase().includes("complete");
  const dueDateStatus = getDueDateStatus(ticket.dueDate);
  const ticketLabels = labels.filter((label) => ticket.labelIds?.includes(label.id));

  const handleClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect(ticket.id);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "group relative flex flex-col gap-2 rounded-lg border bg-white p-3 text-neutral-700 transition-[transform,box-shadow,border-color,opacity] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 dark:bg-dark-bg dark:text-neutral-200",
        selectionMode ? "pl-10" : "pl-5",
        isComplete
          ? "border-emerald-500 bg-emerald-50/50 hover:border-emerald-600 dark:border-emerald-400 dark:bg-emerald-950/20 dark:hover:border-emerald-300"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800",
        highlight && "ring-2 ring-blue-400/30 dark:ring-blue-500/30",
        isSelected && "border-neutral-400 shadow-sm opacity-60 dark:border-neutral-600",
        (onClick || selectionMode) && "cursor-pointer",
        className,
      )}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <div className={clsx(
            "flex h-4 w-4 items-center justify-center rounded transition",
            isSelected
              ? "bg-neutral-900 dark:bg-white"
              : "border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900"
          )}>
            {isSelected && <Check className="h-3 w-3 text-white dark:text-neutral-900" />}
          </div>
        </div>
      )}

      {/* Priority Indicator */}
      {!selectionMode && (
        <span
          aria-hidden
          className={clsx("absolute inset-y-2 left-2 w-1 rounded-full", priorityAccent[ticket.priority])}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
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

      {/* Due Date Badge */}
      {ticket.dueDate && (
        <div className={clsx(
          "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium",
          dueDateBadgeStyles[dueDateStatus]
        )}>
          <Calendar className="h-3 w-3" />
          <span>{formatDueDate(ticket.dueDate)}</span>
        </div>
      )}

      {/* Labels */}
      {ticketLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ticketLabels.map((label) => (
            <div
              key={label.id}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              <span>{label.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
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
            <p className="text-[10px] text-neutral-400 dark:text-neutral-500">Assignee</p>
          </div>
        </div>
        {ticket.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1 text-[10px] font-medium text-neutral-400 dark:text-neutral-500">
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
