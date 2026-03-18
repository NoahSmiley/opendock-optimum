import { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { Calendar, Paperclip } from "lucide-react";
import type { Ticket, Label, BoardMember } from "@/stores/boards/types";
import { getDueDateStatus } from "@/lib/utils/ticketHelpers";
import { IssueTypeIcon } from "./IssueTypeIcon";

interface TicketCardProps {
  ticket: Ticket;
  labels: Label[];
  members: BoardMember[];
  onClick: () => void;
  onTitleUpdate?: (ticketId: string, title: string) => Promise<void>;
}

export function TicketCard({ ticket, labels, members, onClick, onTitleUpdate }: TicketCardProps) {
  const assignee = members.find((m) => (ticket.assigneeIds ?? []).includes(m.id));
  const ticketLabels = labels.filter((l) => (ticket.labelIds ?? []).includes(l.id));
  const dueDateStatus = ticket.dueDate ? getDueDateStatus(ticket.dueDate) : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isEditing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [isEditing]);

  const handleClick = () => { if (!isEditing) onClick(); };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (onTitleUpdate) { e.stopPropagation(); setIsEditing(true); }
  };

  const saveTitleEdit = async () => {
    if (editedTitle.trim() && editedTitle !== ticket.title && onTitleUpdate) {
      await onTitleUpdate(ticket.id, editedTitle.trim());
    } else { setEditedTitle(ticket.title); }
    setIsEditing(false);
  };

  return (
    <div onClick={handleClick}
      className="group cursor-pointer rounded-md border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]">
      <div className="mb-1.5 flex items-start gap-2">
        <IssueTypeIcon type={ticket.issueType || "task"} size="sm" className="mt-0.5 shrink-0 opacity-50" />
        {isEditing ? (
          <input ref={inputRef} value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={saveTitleEdit} onKeyDown={(e) => { if (e.key === "Enter") saveTitleEdit(); if (e.key === "Escape") { setEditedTitle(ticket.title); setIsEditing(false); } }}
            onClick={(e) => e.stopPropagation()}
            className="w-full truncate rounded border border-blue-500/50 bg-transparent px-1 py-0.5 text-[13px] font-medium text-white outline-none" />
        ) : (
          <p onClick={handleTitleClick} className={clsx(
            "truncate text-[13px] font-medium text-neutral-200",
            onTitleUpdate && "hover:text-white",
          )}>{ticket.title}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          {ticket.key && <span className="shrink-0 font-mono text-[10px] text-neutral-500">{ticket.key}</span>}
          <PriorityDot priority={ticket.priority} />
          {ticketLabels.length > 0 && (
            <div className="flex items-center gap-1 min-w-0">
              {ticketLabels.slice(0, 2).map((l) => (
                <span key={l.id} className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} title={l.name} />
              ))}
              {ticketLabels.length > 2 && <span className="text-[10px] text-neutral-600">+{ticketLabels.length - 2}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {dueDateStatus && <Calendar className={clsx("h-3 w-3", dueDateStatus === "overdue" && "text-red-400", dueDateStatus === "due-soon" && "text-amber-400", dueDateStatus === "upcoming" && "text-neutral-500")} />}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="flex items-center gap-0.5 text-neutral-500"><Paperclip className="h-2.5 w-2.5" /><span className="text-[10px]">{ticket.attachments.length}</span></div>
          )}
          {(ticket.storyPoints || ticket.estimate) && (
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-400">{ticket.storyPoints || ticket.estimate}</span>
          )}
          <span className="inline-flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-medium text-neutral-400"
            title={assignee?.name ?? "Unassigned"}>
            {(assignee?.name ?? "?").charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  return (
    <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full",
      priority === "high" && "bg-red-400/80",
      priority === "medium" && "bg-amber-300/80",
      priority === "low" && "bg-emerald-400/80",
    )} title={`Priority: ${priority}`} />
  );
}
