import { useState } from "react";
import { X, Check } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";

interface BulkAssignModalProps {
  isOpen: boolean;
  board: KanbanBoard;
  selectedCount: number;
  onClose: () => void;
  onConfirm: (assigneeIds: string[]) => Promise<void>;
}

export function BulkAssignModal({
  isOpen,
  board,
  selectedCount,
  onClose,
  onConfirm,
}: BulkAssignModalProps) {
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  const toggleAssignee = (memberId: string) => {
    setSelectedAssignees((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleConfirm = async () => {
    if (selectedAssignees.size === 0) return;

    setIsAssigning(true);
    try {
      await onConfirm(Array.from(selectedAssignees));
      onClose();
    } catch (error) {
      console.error("Failed to assign tickets:", error);
    } finally {
      setIsAssigning(false);
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
              Assign Tickets
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Select team members for {selectedCount} ticket{selectedCount > 1 ? 's' : ''}
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
            {board.members.map((member) => (
              <button
                key={member.id}
                onClick={() => toggleAssignee(member.id)}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition",
                  selectedAssignees.has(member.id)
                    ? "border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/20"
                    : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600"
                )}
              >
                <div
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded border-2 transition",
                    selectedAssignees.has(member.id)
                      ? "border-blue-600 bg-blue-600 dark:border-blue-400 dark:bg-blue-400"
                      : "border-neutral-300 dark:border-neutral-600"
                  )}
                >
                  {selectedAssignees.has(member.id) && (
                    <Check className="h-3 w-3 text-white dark:text-neutral-900" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600 dark:bg-neutral-700 dark:text-white">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">
                      {member.name}
                    </p>
                    {member.email && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {member.email}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedAssignees.size === 0 && (
            <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Select at least one team member
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={onClose}
            disabled={isAssigning}
            className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedAssignees.size === 0 || isAssigning}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAssigning ? "Assigning..." : `Assign to ${selectedAssignees.size} member${selectedAssignees.size > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
