import clsx from "clsx";
import { Search, Plus, CheckSquare } from "lucide-react";
import type { KanbanBoard, KanbanTicket } from "@opendock/shared/types";

const priorityFilterOptions: Array<{ value: "all" | KanbanTicket["priority"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export type DueDateFilter = "all" | "overdue" | "due-this-week" | "due-this-month" | "no-due-date";

const dueDateFilterOptions: Array<{ value: DueDateFilter; label: string }> = [
  { value: "all", label: "All dates" },
  { value: "overdue", label: "Overdue" },
  { value: "due-this-week", label: "Due this week" },
  { value: "due-this-month", label: "Due this month" },
  { value: "no-due-date", label: "No due date" },
];

interface BoardToolbarProps {
  board: KanbanBoard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedAssigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  selectedSprintFilter: string;
  onSprintFilterChange: (value: string) => void;
  sprintOptions: Array<{ value: string; label: string }>;
  selectedPriorityFilter: "all" | KanbanTicket["priority"];
  onPriorityFilterChange: (value: "all" | KanbanTicket["priority"]) => void;
  selectedDueDateFilter: DueDateFilter;
  onDueDateFilterChange: (value: DueDateFilter) => void;
  selectedLabelFilter: string;
  onLabelFilterChange: (value: string) => void;
  showUnassignedOnly: boolean;
  onToggleUnassignedOnly: () => void;
  recentOnly: boolean;
  onToggleRecentOnly: () => void;
  filtersActive: boolean;
  onClearFilters: () => void;
  onCreateTicket?: () => void;
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export function BoardToolbar({
  board,
  searchQuery,
  onSearchQueryChange,
  selectedAssigneeFilter,
  onAssigneeFilterChange,
  selectedSprintFilter,
  onSprintFilterChange,
  sprintOptions,
  selectedPriorityFilter,
  onPriorityFilterChange,
  selectedDueDateFilter,
  onDueDateFilterChange,
  selectedLabelFilter,
  onLabelFilterChange,
  showUnassignedOnly,
  onToggleUnassignedOnly,
  recentOnly,
  onToggleRecentOnly,
  filtersActive,
  onClearFilters,
  onCreateTicket,
  selectionMode,
  onToggleSelectionMode,
}: BoardToolbarProps) {
  return (
    <header className="flex w-full flex-shrink-0 border-b border-neutral-200 bg-white/95 py-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-black/90">
      <div className="flex w-full flex-col gap-3 px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 xl:px-10">
        <div className="space-y-1 lg:min-w-[280px]">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{board.name}</h2>
            <span className="text-xs uppercase text-neutral-400 dark:text-neutral-500">{board.tickets.length} tickets</span>
          </div>
          {board.description ? (
            <p className="hidden text-xs text-neutral-500 dark:text-neutral-400 sm:block">{board.description}</p>
          ) : (
            <p className="hidden text-xs text-neutral-500 dark:text-neutral-500 sm:block">Keep work visible across every stage.</p>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 lg:ml-auto lg:max-w-[640px] lg:items-end">
          <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end lg:justify-end">
            {onToggleSelectionMode && (
              <button
                onClick={onToggleSelectionMode}
                className={clsx(
                  "flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-sm font-medium shadow-sm transition",
                  selectionMode
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-400 dark:bg-blue-400 dark:text-neutral-900 dark:hover:bg-blue-300"
                    : "border-neutral-200 bg-white/90 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                )}
                title={selectionMode ? "Exit selection mode" : "Select multiple tickets"}
              >
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">{selectionMode ? "Cancel" : "Select"}</span>
              </button>
            )}
            {onCreateTicket && (
              <button
                onClick={onCreateTicket}
                className="flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                title="Create new ticket"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Ticket</span>
              </button>
            )}
            <label className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm text-neutral-600 shadow-sm focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus-within:border-neutral-600 dark:focus-within:ring-neutral-800/60">
              <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search issues, tags, people"
                className="w-32 bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 sm:w-48"
              />
            </label>
            <select
              value={selectedAssigneeFilter}
              onChange={(event) => onAssigneeFilterChange(event.target.value)}
              className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
            >
              <option value="all">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {board.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select
              value={selectedSprintFilter}
              onChange={(event) => onSprintFilterChange(event.target.value)}
              className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
            >
              {sprintOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedDueDateFilter}
              onChange={(event) => onDueDateFilterChange(event.target.value as DueDateFilter)}
              className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
            >
              {dueDateFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedLabelFilter}
              onChange={(event) => onLabelFilterChange(event.target.value)}
              className="rounded-2xl border border-neutral-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-neutral-600 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-600 dark:focus:ring-neutral-800/60"
            >
              <option value="all">All labels</option>
              <option value="no-label">No label</option>
              {(board.labels || []).map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end lg:justify-end">
            <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white/90 px-1.5 py-1 text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
              {priorityFilterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onPriorityFilterChange(option.value)}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase transition",
                    selectedPriorityFilter === option.value
                      ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
                      : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onToggleUnassignedOnly}
              className={clsx(
                "rounded-full border border-neutral-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white",
                showUnassignedOnly &&
                  "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-white/30 dark:bg-white dark:text-neutral-900",
              )}
            >
              Unassigned
            </button>
            <button
              type="button"
              onClick={onToggleRecentOnly}
              className={clsx(
                "rounded-full border border-neutral-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white",
                recentOnly &&
                  "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-white/30 dark:bg-white dark:text-neutral-900",
              )}
            >
              Updated 7d
            </button>
            {filtersActive ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500 underline-offset-4 hover:underline dark:text-neutral-400"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
