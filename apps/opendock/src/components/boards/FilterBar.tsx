import { useState } from "react";
import clsx from "clsx";
import { Filter, User, Clock, AlertCircle, Calendar, X } from "lucide-react";

interface QuickFilter {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTERS: QuickFilter[] = [
  { id: "my-issues", name: "My Issues", icon: User },
  { id: "recently-updated", name: "Recently Updated", icon: Clock },
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
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? FILTERS : FILTERS.slice(0, 6);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        <Filter className="h-3.5 w-3.5" />
        <span>Quick Filters</span>
      </div>
      {displayed.map((f) => {
        const Icon = f.icon;
        const active = activeFilters.has(f.id);
        return (
          <button
            key={f.id}
            onClick={() => onToggleFilter(f.id)}
            className={clsx(
              "group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-neutral-500 text-white"
                : "border-neutral-600 text-neutral-400 hover:border-neutral-500 hover:text-neutral-300",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{f.name}</span>
            {active && <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />}
          </button>
        );
      })}
      {FILTERS.length > 6 && (
        <button onClick={() => setShowAll(!showAll)}
          className="rounded-full border border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:border-neutral-500 hover:text-neutral-400">
          {showAll ? "Show Less" : `+${FILTERS.length - 6} More`}
        </button>
      )}
      {activeFilters.size > 0 && (
        <button onClick={onClearAll}
          className="ml-2 rounded-full border border-red-700 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-600">
          Clear All ({activeFilters.size})
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
