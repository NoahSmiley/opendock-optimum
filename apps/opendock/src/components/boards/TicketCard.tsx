import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Check, Calendar, Paperclip } from "lucide-react";
import type { Ticket, Label, BoardMember } from "@/stores/boards/types";
import { getDueDateStatus } from "@/lib/utils/ticketHelpers";
import { IssueTypeIcon } from "./IssueTypeIcon";

interface TicketCardProps {
  ticket: Ticket;
  labels: Label[];
  members: BoardMember[];
  onClick: () => void;
  onTitleUpdate?: (ticketId: string, title: string) => Promise<void>;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (ticketId: string) => void;
}

export function TicketCard({
  ticket, labels, members, onClick, onTitleUpdate,
  selectionMode = false, isSelected = false, onToggleSelect,
}: TicketCardProps) {
  const assignee = members.find((m) => (ticket.assigneeIds ?? []).includes(m.id));
  const ticketLabels = labels.filter((l) => (ticket.labelIds ?? []).includes(l.id));
  const dueDateStatus = ticket.dueDate ? getDueDateStatus(ticket.dueDate) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [isEditing]);

  const handleClick = () => {
    if (isEditing) return;
    if (selectionMode && onToggleSelect) onToggleSelect(ticket.id);
    else onClick();
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (!selectionMode && onTitleUpdate) { e.stopPropagation(); setIsEditing(true); }
  };

  const saveTitleEdit = async () => {
    if (editedTitle.trim() && editedTitle !== ticket.title && onTitleUpdate) {
      await onTitleUpdate(ticket.id, editedTitle.trim());
    } else { setEditedTitle(ticket.title); }
    setIsEditing(false);
  };

  return (
    <div onClick={handleClick} className={clsx(
      "group relative cursor-pointer rounded-md border bg-neutral-900/80 p-2.5 transition-[transform,box-shadow,border-color] hover:bg-neutral-900",
      selectionMode ? "pl-9" : "",
      isSelected ? "border-blue-400" : "border-neutral-800 hover:border-neutral-700",
    )}>
      {selectionMode && (
        <div className="absolute left-2.5 top-3">
          <div className={clsx("flex h-4 w-4 items-center justify-center rounded transition",
            isSelected ? "bg-blue-500" : "border-2 border-neutral-600 bg-neutral-900")}>
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>
      )}

      <div className="mb-2 flex items-start gap-2">
        <IssueTypeIcon type={ticket.issueType || "task"} size="sm" className="mt-0.5 shrink-0" />
        {isEditing ? (
          <input ref={inputRef} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={saveTitleEdit} onKeyDown={(e) => { if (e.key === "Enter") saveTitleEdit(); if (e.key === "Escape") { setEditedTitle(ticket.title); setIsEditing(false); } }}
            onClick={(e) => e.stopPropagation()}
            className="w-full truncate rounded border border-blue-500 bg-neutral-950 px-1.5 py-0.5 text-sm font-medium text-white outline-none ring-2 ring-blue-400/20" />
        ) : (
          <p onClick={handleTitleClick} className={clsx(
            "truncate text-sm font-medium text-white",
            onTitleUpdate && !selectionMode && "hover:text-blue-400",
          )}>{ticket.title}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {ticket.key && <span className="shrink-0 font-semibold text-neutral-400 hover:text-blue-400 transition-colors">{ticket.key}</span>}
          <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full",
            ticket.priority === "high" && "bg-rose-400",
            ticket.priority === "medium" && "bg-amber-300",
            ticket.priority === "low" && "bg-emerald-400",
          )} title={`Priority: ${ticket.priority}`} />
          {ticketLabels.length > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              {ticketLabels.slice(0, 2).map((l) => (
                <span key={l.id} className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: l.color }} title={l.name} />
              ))}
              {ticketLabels.length > 2 && <span className="text-[10px] text-neutral-400">+{ticketLabels.length - 2}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dueDateStatus && (
            <Calendar className={clsx("h-3 w-3",
              dueDateStatus === "overdue" && "text-red-500",
              dueDateStatus === "due-soon" && "text-amber-500",
              dueDateStatus === "upcoming" && "text-neutral-400")} />
          )}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-neutral-400">
              <Paperclip className="h-3 w-3" /><span className="text-[10px]">{ticket.attachments.length}</span>
            </div>
          )}
          {(ticket.storyPoints || ticket.estimate) && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300">
              {ticket.storyPoints || ticket.estimate}
            </span>
          )}
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-[10px] font-semibold text-neutral-200"
            title={assignee?.name ?? "Unassigned"}>
            {(assignee?.name ?? "?").charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
