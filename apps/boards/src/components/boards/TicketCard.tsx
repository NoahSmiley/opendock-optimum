import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Check, Calendar, Paperclip } from "lucide-react";
import type { KanbanBoard, KanbanTicket, KanbanUser, KanbanLabel } from "@opendock/shared/types";
import { priorityAccent, priorityStyles, getDueDateStatus, dueDateBadgeStyles, formatDueDate } from "@/lib/ticketStyles";
import { formatTicketKey } from "@/lib/ticketUtils";
import { IssueTypeIcon } from "../IssueTypeSelector";

export interface TicketCardProps {
  ticket: KanbanTicket;
  board?: KanbanBoard;
  column?: KanbanBoard["columns"][number];
  members: KanbanUser[];
  labels: KanbanLabel[];
  sprints: KanbanBoard["sprints"];
  onClick?: () => void;
  onTitleUpdate?: (ticketId: string, newTitle: string) => Promise<void>;
  highlight?: boolean;
  className?: string;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (ticketId: string) => void;
}

export function TicketCard({
  ticket,
  board,
  column,
  members,
  labels = [],
  sprints,
  onClick,
  onTitleUpdate,
  highlight = false,
  className,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TicketCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const assignee = members.find((member) => ticket.assigneeIds.includes(member.id));
  const sprint = sprints.find((item) => item.id === ticket.sprintId);
  const isComplete =
    column?.title.toLowerCase().includes("done") || column?.title.toLowerCase().includes("complete");
  const dueDateStatus = getDueDateStatus(ticket.dueDate);
  const ticketLabels = labels.filter((label) => ticket.labelIds?.includes(label.id));

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleClick = () => {
    // If in edit mode, save and close edit mode
    if (isEditingTitle) {
      handleTitleSave();
      return;
    }

    // Check if user has text selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }

    if (selectionMode && onToggleSelect) {
      onToggleSelect(ticket.id);
    } else if (onClick) {
      onClick();
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (!selectionMode && onTitleUpdate) {
      e.stopPropagation();
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = async () => {
    if (!editedTitle.trim() || editedTitle === ticket.title || !onTitleUpdate) {
      setIsEditingTitle(false);
      setEditedTitle(ticket.title);
      return;
    }

    setIsSaving(true);
    try {
      await onTitleUpdate(ticket.id, editedTitle.trim());
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Failed to update ticket title:", error);
      setEditedTitle(ticket.title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setEditedTitle(ticket.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      handleTitleCancel();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        "group relative rounded-md border bg-white p-2.5 shadow-sm transition-[transform,box-shadow,border-color] hover:shadow-md dark:bg-neutral-900",
        selectionMode ? "pl-9" : "",
        isComplete
          ? "border-neutral-200 dark:border-neutral-800"
          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700",
        highlight && "ring-2 ring-blue-400/30 dark:ring-blue-500/30",
        isSelected && "border-blue-500 shadow-md dark:border-blue-400",
        (onClick || selectionMode) && "cursor-pointer",
        className,
      )}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute left-2.5 top-3">
          <div className={clsx(
            "flex h-4 w-4 items-center justify-center rounded transition",
            isSelected
              ? "bg-blue-600 dark:bg-blue-500"
              : "border-2 border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-900"
          )}>
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      )}

      {/* Title Row - Always visible, single line */}
      <div className="mb-2 flex items-start gap-2">
        <IssueTypeIcon type={ticket.issueType || "task"} size="sm" className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="w-full cursor-pointer truncate rounded border border-blue-500 bg-white px-1.5 py-0.5 text-sm font-medium text-neutral-900 outline-none ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-neutral-950 dark:text-white dark:ring-blue-400/20"
            />
          ) : (
            <p
              onClick={handleTitleClick}
              className={clsx(
                "truncate text-sm font-medium text-neutral-900 dark:text-white",
                onTitleUpdate && !selectionMode && "cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {ticket.title}
            </p>
          )}
        </div>
      </div>

      {/* Metadata Row - Compact, single line */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {/* Ticket Key */}
          <span className="shrink-0 font-semibold text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400">
            {formatTicketKey(ticket, board)}
          </span>

          {/* Priority Indicator */}
          <span
            className={clsx(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              priorityAccent[ticket.priority]
            )}
            title={`Priority: ${ticket.priority}`}
          />

          {/* Labels - Max 2 shown */}
          {ticketLabels.length > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              {ticketLabels.slice(0, 2).map((label) => (
                <span
                  key={label.id}
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: label.color }}
                  title={label.name}
                />
              ))}
              {ticketLabels.length > 2 && (
                <span className="text-[10px] text-neutral-400">+{ticketLabels.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Right side - Avatar and meta */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Due Date Icon (only if exists and not completed) */}
          {ticket.dueDate && !isComplete && (
            <Calendar
              className={clsx(
                "h-3 w-3",
                dueDateStatus === "overdue" && "text-red-500",
                dueDateStatus === "soon" && "text-amber-500",
                dueDateStatus === "ok" && "text-neutral-400"
              )}
              title={formatDueDate(ticket.dueDate)}
            />
          )}

          {/* Attachments Icon */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-neutral-400">
              <Paperclip className="h-3 w-3" />
              <span className="text-[10px]">{ticket.attachments.length}</span>
            </div>
          )}

          {/* Story Points */}
          {(ticket.storyPoints || ticket.estimate) && (
            <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {ticket.storyPoints || ticket.estimate}
            </span>
          )}

          {/* Assignee Avatar */}
          <span
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
            title={assignee ? assignee.name : "Unassigned"}
          >
            {(assignee?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
