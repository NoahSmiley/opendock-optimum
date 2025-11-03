import clsx from "clsx";
import { Search, Plus, CheckSquare } from "lucide-react";
import type { KanbanBoard } from "@opendock/shared/types";

interface BoardToolbarProps {
  board: KanbanBoard;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onCreateTicket?: () => void;
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export function BoardToolbar({
  board,
  searchQuery,
  onSearchQueryChange,
  onCreateTicket,
  selectionMode,
  onToggleSelectionMode,
}: BoardToolbarProps) {
  return (
    <header className="flex w-full flex-shrink-0 border-b border-neutral-200 bg-white/95 py-3 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="flex w-full flex-col gap-3 px-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 xl:px-10">
        <div className="space-y-1 lg:min-w-[280px]">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{board.name}</h2>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">{board.tickets.length} tickets</span>
          </div>
          {board.description ? (
            <p className="hidden text-xs text-neutral-500 dark:text-neutral-400 sm:block">{board.description}</p>
          ) : (
            <p className="hidden text-xs text-neutral-500 dark:text-neutral-500 sm:block">Keep work visible across every stage.</p>
          )}
        </div>
        <div className="flex w-full items-center gap-2 sm:justify-end lg:ml-auto lg:max-w-[500px]">
          <label className="flex flex-1 items-center gap-2 rounded-md border border-neutral-200 bg-white/90 px-3 py-2 text-sm text-neutral-600 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/20">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <input
              data-search-input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
            />
          </label>
          {onToggleSelectionMode && (
            <button
              onClick={onToggleSelectionMode}
              className={clsx(
                "flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium shadow-sm transition",
                selectionMode
                  ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              )}
              title={selectionMode ? "Exit selection mode" : "Select multiple tickets"}
            >
              <CheckSquare className="h-4 w-4" />
            </button>
          )}
          {onCreateTicket && (
            <button
              onClick={onCreateTicket}
              className="flex items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 dark:border-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              title="Create new ticket"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
