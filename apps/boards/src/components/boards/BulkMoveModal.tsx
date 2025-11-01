import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";

interface BulkMoveModalProps {
  isOpen: boolean;
  board: KanbanBoard;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (targetColumnId: string) => Promise<void>;
}

export function BulkMoveModal({
  isOpen,
  board,
  selectedCount,
  onClose,
  onConfirm,
}: BulkMoveModalProps) {
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const handleConfirm = async () => {
    if (!selectedColumnId) return;

    setIsMoving(true);
    try {
      await onConfirm(selectedColumnId);
      onClose();
    } catch (error) {
      console.error("Failed to move tickets:", error);
    } finally {
      setIsMoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Move Tickets
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Select a column to move {selectedCount} ticket{selectedCount > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-2">
            {board.columns.map((column) => (
              <button
                key={column.id}
                onClick={() => setSelectedColumnId(column.id)}
                className={clsx(
                  "flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition",
                  selectedColumnId === column.id
                    ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20"
                    : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2 transition",
                      selectedColumnId === column.id
                        ? "border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                        : "border-neutral-300 dark:border-neutral-600"
                    )}
                  >
                    {selectedColumnId === column.id && (
                      <div className="h-2 w-2 rounded-full bg-white dark:bg-neutral-900" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {column.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {board.tickets.filter(t => t.columnId === column.id).length} tickets
                    </p>
                  </div>
                </div>
                {selectedColumnId === column.id && (
                  <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={onClose}
            disabled={isMoving}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedColumnId || isMoving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMoving ? "Moving..." : "Move Tickets"}
          </button>
        </div>
      </div>
    </div>
  );
}
