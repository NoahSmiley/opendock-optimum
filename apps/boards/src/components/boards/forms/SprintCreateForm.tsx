import { Loader2, Plus } from "lucide-react";
import type { SprintFormState } from "./types";

interface SprintCreateFormProps {
  form: SprintFormState;
  onChange: (field: keyof SprintFormState, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  creating: boolean;
}

export function SprintCreateForm({ form, onChange, onSubmit, creating }: SprintCreateFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-lg border border-slate-200/70 bg-white/70 p-5 text-xs text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-300"
    >
      <div className="grid gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
          Sprint name
        </label>
        <input
          required
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
          Schedule
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(event) => onChange("startDate", event.target.value)}
            className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
          />
          <input
            type="date"
            required
            value={form.endDate}
            onChange={(event) => onChange("endDate", event.target.value)}
            className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
          Sprint goal
        </label>
        <textarea
          value={form.goal}
          onChange={(event) => onChange("goal", event.target.value)}
          rows={2}
          placeholder="What do you want to accomplish?"
          className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2 text-xs font-medium text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
        />
      </div>
      <button
        type="submit"
        disabled={creating}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create sprint
      </button>
    </form>
  );
}
