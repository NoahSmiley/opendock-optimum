import { Loader2, Plus } from "lucide-react";
import type { KanbanBoard } from "@opendock/shared/types";
import type { BacklogFormState } from "./types";

interface BacklogQuickAddFormProps {
  form: BacklogFormState;
  members: KanbanBoard["members"];
  onChange: (field: keyof BacklogFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  creating: boolean;
}

export function BacklogQuickAddForm({ form, members, onChange, onSubmit, creating }: BacklogQuickAddFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)_minmax(0,0.32fr)]"
    >
      <input
        required
        value={form.title}
        onChange={(event) => onChange("title", event.target.value)}
        placeholder="Issue title"
        className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
      />
      <textarea
        value={form.description}
        onChange={(event) => onChange("description", event.target.value)}
        rows={2}
        placeholder="Description (optional)"
        className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
      />
      <div className="flex flex-col gap-2">
        <select
          value={form.assigneeId}
          onChange={(event) => onChange("assigneeId", event.target.value)}
          className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <input
          value={form.tags}
          onChange={(event) => onChange("tags", event.target.value)}
          placeholder="Tags (comma-separated)"
          className="rounded-md border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
        />
      </div>
      <button
        type="submit"
        disabled={creating}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add to backlog
      </button>
    </form>
  );
}
