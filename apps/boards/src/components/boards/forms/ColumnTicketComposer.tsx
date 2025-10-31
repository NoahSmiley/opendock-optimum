import { Loader2, Plus } from "lucide-react";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";
import type { ColumnDraftState } from "./types";

interface ColumnTicketComposerProps {
  draft: ColumnDraftState;
  members: KanbanBoard["members"];
  onDraftChange: (patch: Partial<ColumnDraftState>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitting: boolean;
}

export function ColumnTicketComposer({
  draft,
  members,
  onDraftChange,
  onSubmit,
  onCancel,
  submitting,
}: ColumnTicketComposerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-md border border-slate-200/70 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-neutral-950"
    >
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Issue summary
          <input
            required
            value={draft.title}
            onChange={(event) => onDraftChange({ title: event.target.value })}
            className="mt-2 w-full rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/10 dark:bg-black dark:text-slate-100 dark:focus:border-white/30 dark:focus:ring-white/20"
            placeholder="Describe the work"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Assignee
          <select
            value={draft.assigneeId}
            onChange={(event) => onDraftChange({ assigneeId: event.target.value })}
            className="rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/10 dark:bg-black dark:text-slate-100 dark:focus:border-white/30 dark:focus:ring-white/20"
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          Priority
          <select
            value={draft.priority}
            onChange={(event) =>
              onDraftChange({ priority: event.target.value as KanbanTicket["priority"] })
            }
            className="rounded-md border border-slate-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/10 dark:bg-black dark:text-slate-100 dark:focus-border-white/30 dark:focus:ring-white/20"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add issue
        </button>
      </div>
    </form>
  );
}
