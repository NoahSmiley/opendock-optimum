import clsx from "clsx";
import { Clock, AlertCircle, Calendar, X } from "lucide-react";

interface QuickFilter {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTERS: QuickFilter[] = [
  { id: "recently-updated", name: "Recent", icon: Clock },
  { id: "unassigned", name: "Unassigned", icon: AlertCircle },
  { id: "due-soon", name: "Due Soon", icon: Calendar },
  { id: "overdue", name: "Overdue", icon: AlertCircle },
  { id: "high-priority", name: "High Priority", icon: AlertCircle },
];

interface FilterBarProps {
  activeFilters: Set<string>;
  onToggleFilter: (id: string) => void;
  onClearAll: () => void;
}

export function FilterBar({ activeFilters, onToggleFilter, onClearAll }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FILTERS.map((f) => {
        const Icon = f.icon;
        const active = activeFilters.has(f.id);
        return (
          <button key={f.id} onClick={() => onToggleFilter(f.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
              active
                ? "border-white/[0.12] text-neutral-200"
                : "border-white/[0.06] text-neutral-500 hover:border-white/[0.1] hover:text-neutral-300",
            )}>
            <Icon className="h-3 w-3" />
            <span>{f.name}</span>
            {active && <X className="h-2.5 w-2.5 opacity-50 hover:opacity-100" />}
          </button>
        );
      })}
      {activeFilters.size > 0 && (
        <button onClick={onClearAll}
          className="ml-1 text-[11px] text-neutral-500 hover:text-neutral-300">
          Clear
        </button>
      )}
    </div>
  );
}

/** Apply active quick filters to a ticket list */
export function applyQuickFilters<T extends { assigneeIds: string[]; updatedAt: string; dueDate?: string; priority: string }>(
  tickets: T[],
  activeFilters: Set<string>,
): T[] {
  if (activeFilters.size === 0) return tickets;
  return tickets.filter((t) => {
    for (const id of activeFilters) {
      if (id === "unassigned" && (t.assigneeIds ?? []).length > 0) return false;
      if (id === "high-priority" && t.priority !== "high") return false;
      if (id === "overdue" && (!t.dueDate || new Date(t.dueDate) >= new Date())) return false;
      if (id === "due-soon") {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        const week = new Date(); week.setDate(week.getDate() + 7);
        if (d < new Date() || d > week) return false;
      }
      if (id === "recently-updated") {
        const week = new Date(); week.setDate(week.getDate() - 7);
        if (new Date(t.updatedAt) < week) return false;
      }
    }
    return true;
  });
}
