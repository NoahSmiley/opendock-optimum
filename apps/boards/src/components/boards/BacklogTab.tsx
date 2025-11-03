import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";
import { IssueTypeIcon } from "../IssueTypeSelector";
import { formatTicketKey } from "@/lib/ticketUtils";
import clsx from "clsx";

interface BacklogTabProps {
  board: KanbanBoard;
}

export function BacklogTab({ board }: BacklogTabProps) {
  // Get tickets from backlog column (typically the first column or one named "Backlog")
  const backlogColumn = board.columns.find(c =>
    c.title.toLowerCase() === "backlog" || c.title.toLowerCase() === "to do"
  ) || board.columns[0];

  const backlogTickets = board.tickets
    .filter(t => t.columnId === backlogColumn?.id)
    .sort((a, b) => a.order - b.order);

  // Group by priority
  const ticketsByPriority = {
    high: backlogTickets.filter(t => t.priority === "high"),
    medium: backlogTickets.filter(t => t.priority === "medium"),
    low: backlogTickets.filter(t => t.priority === "low"),
  };

  const TicketRow = ({ ticket }: { ticket: KanbanTicket }) => {
    const assignee = board.members.find(m => ticket.assigneeIds.includes(m.id));
    const labels = board.labels?.filter(l => ticket.labelIds?.includes(l.id)) || [];

    return (
      <div className="group flex items-center gap-4 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
        {/* Issue Type & Key */}
        <div className="flex items-center gap-2">
          <IssueTypeIcon type={ticket.issueType || "task"} size="sm" className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {formatTicketKey(ticket, board)}
          </span>
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
            {ticket.title}
          </p>
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div className="flex items-center gap-1">
            {labels.slice(0, 3).map(label => (
              <span
                key={label.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.name}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-xs text-neutral-400">+{labels.length - 3}</span>
            )}
          </div>
        )}

        {/* Priority */}
        <div
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-semibold uppercase",
            ticket.priority === "high" && "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
            ticket.priority === "medium" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            ticket.priority === "low" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          )}
        >
          {ticket.priority}
        </div>

        {/* Assignee */}
        <div className="flex items-center gap-2">
          {assignee ? (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                {assignee.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden text-sm text-neutral-600 dark:text-neutral-400 sm:inline">
                {assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-xs text-neutral-400 dark:text-neutral-500">Unassigned</span>
          )}
        </div>

        {/* Story Points */}
        {ticket.storyPoints && (
          <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {ticket.storyPoints}
          </div>
        )}
      </div>
    );
  };

  if (!backlogColumn) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No backlog column found. Create a "Backlog" or "To Do" column to see tickets here.
          </p>
        </div>
      </div>
    );
  }

  if (backlogTickets.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Backlog</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              No tickets in the backlog yet
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Create tickets and move them to "{backlogColumn.title}" to see them here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Backlog</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {backlogTickets.length} {backlogTickets.length === 1 ? "ticket" : "tickets"} in {backlogColumn.title}
          </p>
        </div>
      </div>

      {/* Priority Sections */}
      <div className="space-y-6">
        {/* High Priority */}
        {ticketsByPriority.high.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {ticketsByPriority.high.length}
              </span>
              High Priority
            </h3>
            <div className="space-y-2">
              {ticketsByPriority.high.map(ticket => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority */}
        {ticketsByPriority.medium.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                {ticketsByPriority.medium.length}
              </span>
              Medium Priority
            </h3>
            <div className="space-y-2">
              {ticketsByPriority.medium.map(ticket => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        )}

        {/* Low Priority */}
        {ticketsByPriority.low.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:bg-emerald-300">
                {ticketsByPriority.low.length}
              </span>
              Low Priority
            </h3>
            <div className="space-y-2">
              {ticketsByPriority.low.map(ticket => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
