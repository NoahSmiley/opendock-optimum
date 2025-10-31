import { Loader2, Plus } from "lucide-react";

interface AddColumnFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  creating: boolean;
}

export function AddColumnForm({ title, onTitleChange, onSubmit, creating }: AddColumnFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex min-w-[20rem] max-w-[20rem] flex-col gap-3 self-start rounded-lg border border-dashed border-slate-300/70 bg-white/60 p-5 text-sm text-slate-500 shadow-sm dark:border-white/20 dark:bg-white/10"
    >
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add column</p>
      <input
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Column name"
        className="rounded-md border border-slate-200/70 bg-white/80 px-3.5 py-2.5 text-sm text-slate-700 shadow-inner shadow-slate-900/5 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200/60 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:focus:border-white/30 dark:focus:ring-white/20"
      />
      <button
        type="submit"
        disabled={creating}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
      >
        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add column
      </button>
    </form>
  );
}
