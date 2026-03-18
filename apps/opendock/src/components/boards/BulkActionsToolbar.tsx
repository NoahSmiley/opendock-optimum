import { CheckSquare, ArrowRight, UserPlus, Trash2, X } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkMove: () => void;
  onBulkAssign: () => void;
  onBulkDelete: () => void;
  onExitSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkMove,
  onBulkAssign,
  onBulkDelete,
  onExitSelection,
}: BulkActionsToolbarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2.5 shadow-xl">
        <span className="text-sm font-medium text-white">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-neutral-700" />

        <button onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800">
          <CheckSquare className="h-3.5 w-3.5" />
          {selectedCount === totalCount ? "Deselect All" : "Select All"}
        </button>

        <button onClick={onBulkMove} disabled={selectedCount === 0}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-40">
          <ArrowRight className="h-3.5 w-3.5" /> Move
        </button>

        <button onClick={onBulkAssign} disabled={selectedCount === 0}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 disabled:opacity-40">
          <UserPlus className="h-3.5 w-3.5" /> Assign
        </button>

        <button onClick={onBulkDelete} disabled={selectedCount === 0}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950 disabled:opacity-40">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>

        <div className="h-4 w-px bg-neutral-700" />

        <button onClick={onExitSelection}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
