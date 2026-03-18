import { useState } from "react";
import { Users, Trash2 } from "lucide-react";
import type { Ticket, Board, BoardMember, Label } from "@/stores/boards/types";
import { formatRelativeDate } from "@/lib/utils/ticketHelpers";
import { AssignMenu } from "./AssignMenu";
import { LabelMenu } from "./LabelMenu";

interface TicketDetailSidebarProps {
  ticket: Ticket;
  board: Board;
  members: BoardMember[];
  labels: Label[];
  onUpdate: (updates: Partial<Ticket>) => Promise<void>;
  onRequestDelete: () => void;
}

export function TicketDetailSidebar({ ticket, board, members, labels, onUpdate, onRequestDelete }: TicketDetailSidebarProps) {
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showLabelMenu, setShowLabelMenu] = useState(false);
  const [isEditingSP, setIsEditingSP] = useState(false);
  const [editedSP, setEditedSP] = useState(ticket.storyPoints?.toString() || "");
  const ticketLabels = labels.filter((l) => (ticket.labelIds ?? []).includes(l.id));

  const saveSP = async () => {
    const parsed = editedSP.trim() ? Number(editedSP) : NaN;
    const points = Number.isFinite(parsed) ? parsed : null;
    if (points !== (ticket.storyPoints ?? null)) {
      await onUpdate({ storyPoints: points } as Partial<Ticket>);
    }
    setIsEditingSP(false);
  };

  const toggleAssignee = (memberId: string) => {
    const aids = ticket.assigneeIds ?? [];
    const ids = aids.includes(memberId) ? aids.filter((id) => id !== memberId) : [...aids, memberId];
    onUpdate({ assigneeIds: ids });
  };

  const toggleLabel = (labelId: string) => {
    const lids = ticket.labelIds ?? [];
    const ids = lids.includes(labelId) ? lids.filter((id) => id !== labelId) : [...lids, labelId];
    onUpdate({ labelIds: ids });
  };

  const selectCls = "w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500";

  return (
    <div className="w-80 border-l border-neutral-800 bg-neutral-900 px-6 py-6">
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <button onClick={() => setShowAssignMenu(!showAssignMenu)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700">
            <Users className="mr-1.5 inline h-4 w-4" />Assign
          </button>
          {showAssignMenu && <AssignMenu members={members} assigneeIds={ticket.assigneeIds ?? []} onToggle={toggleAssignee} onClose={() => setShowAssignMenu(false)} />}
        </div>
        <button onClick={onRequestDelete} className="rounded-md border border-red-800 bg-neutral-800 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-950">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <Field label="Status">
        <select value={ticket.columnId} onChange={(e) => onUpdate({ columnId: e.target.value })} className={selectCls}>
          {board.columns.map((col) => <option key={col.id} value={col.id}>{col.title}</option>)}
        </select>
      </Field>

      <Field label="Priority">
        <select value={ticket.priority} onChange={(e) => onUpdate({ priority: e.target.value as Ticket["priority"] })} className={selectCls}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
      </Field>

      <Field label="Labels">
        <div className="relative">
          <button onClick={() => setShowLabelMenu(!showLabelMenu)}
            className="min-h-[40px] w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-left text-sm transition hover:border-neutral-600">
            <div className="flex flex-wrap gap-1">
              {ticketLabels.length > 0 ? ticketLabels.map((l) => (
                <span key={l.id} className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
              )) : <span className="text-neutral-500">Select labels...</span>}
            </div>
          </button>
          {showLabelMenu && <LabelMenu labels={labels} selectedIds={ticket.labelIds ?? []} onToggle={toggleLabel} onClose={() => setShowLabelMenu(false)} />}
        </div>
      </Field>

      <Field label="Story Points">
        {isEditingSP ? (
          <input type="number" value={editedSP} onChange={(e) => setEditedSP(e.target.value)} onBlur={saveSP} autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") saveSP(); if (e.key === "Escape") setIsEditingSP(false); }}
            className="w-full rounded-md border border-blue-500 bg-neutral-800 px-3 py-2 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-blue-500/20" />
        ) : (
          <div onClick={() => setIsEditingSP(true)} className="cursor-text rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-medium text-white hover:border-neutral-600">
            {ticket.storyPoints || "-"}
          </div>
        )}
      </Field>

      <Field label="Due Date">
        <input type="date" value={ticket.dueDate?.split("T")[0] ?? ""} onChange={(e) => onUpdate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-medium text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
      </Field>

      <div className="border-t border-neutral-700 pt-4">
        <div className="space-y-2 text-xs text-neutral-400">
          <div>Created {formatRelativeDate(ticket.createdAt)}</div>
          <div>Updated {formatRelativeDate(ticket.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-400">{label}</label>
      {children}
    </div>
  );
}
