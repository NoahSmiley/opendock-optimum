import { X, Trash2, Move, Users, CheckSquare } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkMove: () => void;
  onBulkAssign: () => void;
  board: KanbanBoard;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkMove,
  onBulkAssign,
  board,
}: BulkActionsToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
        {/* Selection Info */}
        <div className="flex items-center gap-3 border-r border-neutral-200 pr-4 dark:border-neutral-700">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {selectedCount} selected
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {allSelected ? "All tickets" : `of ${totalCount} total`}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!allSelected && (
            <button
              onClick={onSelectAll}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Select All
            </button>
          )}

          <button
            onClick={onBulkMove}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Move selected tickets"
          >
            <Move className="h-4 w-4" />
            <span className="hidden sm:inline">Move</span>
          </button>

          <button
            onClick={onBulkAssign}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            title="Assign selected tickets"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Assign</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            title="Delete selected tickets"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="ml-2 rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          title="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
