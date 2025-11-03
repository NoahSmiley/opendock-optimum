import { useState } from "react";
import clsx from "clsx";
import {
  User,
  Clock,
  AlertCircle,
  Calendar,
  Tag,
  Bug,
  CheckCircle,
  BookOpen,
  Target,
  Filter,
  X
} from "lucide-react";
import type { KanbanBoard, KanbanTicket, IssueType } from "@opendock/shared/types";

export interface QuickFilter {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  isActive: boolean;
  apply: (ticket: KanbanTicket, board: KanbanBoard, currentUserId?: string) => boolean;
}

interface QuickFiltersProps {
  board: KanbanBoard;
  currentUserId?: string;
  onFiltersChange: (filters: QuickFilter[]) => void;
  className?: string;
}

export function QuickFilters({
  board,
  currentUserId,
  onFiltersChange,
  className,
}: QuickFiltersProps) {
  const [filters, setFilters] = useState<QuickFilter[]>([
    {
      id: "my-issues",
      name: "My Issues",
      icon: User,
      description: "Issues assigned to me",
      isActive: false,
      apply: (ticket, _, userId) => {
        if (!userId) return true;
        return ticket.assigneeIds.includes(userId);
      },
    },
    {
      id: "recently-updated",
      name: "Recently Updated",
      icon: Clock,
      description: "Updated in the last 7 days",
      isActive: false,
      apply: (ticket) => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const updatedDate = new Date(ticket.updatedAt);
        return updatedDate >= sevenDaysAgo;
      },
    },
    {
      id: "unassigned",
      name: "Unassigned",
      icon: AlertCircle,
      description: "No assignee",
      isActive: false,
      apply: (ticket) => ticket.assigneeIds.length === 0,
    },
    {
      id: "due-soon",
      name: "Due Soon",
      icon: Calendar,
      description: "Due in the next 7 days",
      isActive: false,
      apply: (ticket) => {
        if (!ticket.dueDate) return false;
        const dueDate = new Date(ticket.dueDate);
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      },
    },
    {
      id: "overdue",
      name: "Overdue",
      icon: AlertCircle,
      description: "Past due date",
      isActive: false,
      apply: (ticket) => {
        if (!ticket.dueDate) return false;
        const dueDate = new Date(ticket.dueDate);
        return dueDate < new Date();
      },
    },
    {
      id: "high-priority",
      name: "High Priority",
      icon: AlertCircle,
      description: "High priority items",
      isActive: false,
      apply: (ticket) => ticket.priority === "high",
    },
    {
      id: "has-labels",
      name: "Has Labels",
      icon: Tag,
      description: "Items with labels",
      isActive: false,
      apply: (ticket) => ticket.labelIds && ticket.labelIds.length > 0,
    },
    {
      id: "bugs",
      name: "Bugs",
      icon: Bug,
      description: "Bug type issues",
      isActive: false,
      apply: (ticket) => ticket.issueType === "bug",
    },
    {
      id: "stories",
      name: "Stories",
      icon: BookOpen,
      description: "Story type issues",
      isActive: false,
      apply: (ticket) => ticket.issueType === "story",
    },
    {
      id: "tasks",
      name: "Tasks",
      icon: CheckCircle,
      description: "Task type issues",
      isActive: false,
      apply: (ticket) => ticket.issueType === "task",
    },
    {
      id: "epics",
      name: "Epics",
      icon: Target,
      description: "Epic type issues",
      isActive: false,
      apply: (ticket) => ticket.issueType === "epic",
    },
  ]);

  const [showAllFilters, setShowAllFilters] = useState(false);

  const toggleFilter = (filterId: string) => {
    const updatedFilters = filters.map(filter => ({
      ...filter,
      isActive: filter.id === filterId ? !filter.isActive : filter.isActive,
    }));
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = filters.map(filter => ({
      ...filter,
      isActive: false,
    }));
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = filters.filter(f => f.isActive).length;
  const displayedFilters = showAllFilters ? filters : filters.slice(0, 6);

  return (
    <div className={clsx("space-y-3", className)}>
      {/* Quick Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-wood-600 dark:text-paper-400">
          <Filter className="h-3.5 w-3.5" />
          <span>Quick Filters</span>
        </div>

        {displayedFilters.map(filter => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              onClick={() => toggleFilter(filter.id)}
              className={clsx(
                "group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                filter.isActive
                  ? "border-wood-600 bg-wood-600 text-white shadow-warm-sm dark:border-paper-300 dark:bg-paper-100 dark:text-wood-900"
                  : "border-wood-200 bg-paper-50 text-wood-600 hover:border-wood-300 hover:bg-paper-100 dark:border-wood-700 dark:bg-wood-800 dark:text-paper-400 dark:hover:border-wood-600 dark:hover:bg-wood-700"
              )}
              title={filter.description}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{filter.name}</span>
              {filter.isActive && (
                <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              )}
            </button>
          );
        })}

        {filters.length > 6 && (
          <button
            onClick={() => setShowAllFilters(!showAllFilters)}
            className="rounded-full border border-wood-200 bg-paper-50 px-3 py-1.5 text-xs font-medium text-wood-500 transition hover:border-wood-300 hover:bg-paper-100 dark:border-wood-700 dark:bg-wood-800 dark:text-paper-500 dark:hover:border-wood-600 dark:hover:bg-wood-700"
          >
            {showAllFilters ? "Show Less" : `+${filters.length - 6} More`}
          </button>
        )}

        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="ml-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-700 dark:hover:bg-red-900"
          >
            Clear All ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-wood-100 px-3 py-2 text-xs text-wood-700 dark:bg-wood-800 dark:text-paper-300">
          <span className="font-semibold">Active:</span>
          <div className="flex flex-wrap gap-1">
            {filters.filter(f => f.isActive).map(filter => (
              <span
                key={filter.id}
                className="rounded-md bg-wood-200 px-2 py-0.5 font-medium dark:bg-wood-700"
              >
                {filter.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export a function to apply active filters to tickets
export function applyQuickFilters(
  tickets: KanbanTicket[],
  filters: QuickFilter[],
  board: KanbanBoard,
  currentUserId?: string
): KanbanTicket[] {
  const activeFilters = filters.filter(f => f.isActive);

  if (activeFilters.length === 0) {
    return tickets;
  }

  return tickets.filter(ticket => {
    // Ticket must pass ALL active filters (AND logic)
    return activeFilters.every(filter =>
      filter.apply(ticket, board, currentUserId)
    );
  });
}