import { useState, useRef, useEffect } from "react";
import { X, Plus, GripVertical, Pencil, Trash2, Columns, Info } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type SettingsTab = "columns" | "board-info";

interface BoardSettingsModalProps {
  isOpen: boolean;
  board: KanbanBoard;
  onClose: () => void;
  onCreateColumn: (title: string) => Promise<void>;
  onRenameColumn: (columnId: string, newTitle: string) => Promise<void>;
  onUpdateColumnWipLimit: (columnId: string, wipLimit: number | null) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
}

export function BoardSettingsModal({
  isOpen,
  board,
  onClose,
  onCreateColumn,
  onRenameColumn,
  onUpdateColumnWipLimit,
  onDeleteColumn,
}: BoardSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("columns");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingColumnId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingColumnId]);

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    setIsCreating(true);
    try {
      await onCreateColumn(newColumnTitle.trim());
      setNewColumnTitle("");
    } catch (error) {
      console.error("Failed to create column:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (columnId: string, currentTitle: string) => {
    setEditingColumnId(columnId);
    setEditValue(currentTitle);
  };

  const handleSaveEdit = async () => {
    if (!editingColumnId || !editValue.trim() || editValue === board.columns.find(c => c.id === editingColumnId)?.title) {
      setEditingColumnId(null);
      return;
    }

    setIsRenaming(true);
    try {
      await onRenameColumn(editingColumnId, editValue.trim());
      setEditingColumnId(null);
    } catch (error) {
      console.error("Failed to rename column:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingColumnId(null);
    setEditValue("");
  };

  const handleWipLimitChange = async (columnId: string, value: string) => {
    const wipLimit = value === "" ? null : parseInt(value, 10);
    if (wipLimit !== null && (isNaN(wipLimit) || wipLimit < 1)) {
      return; // Invalid input
    }
    try {
      await onUpdateColumnWipLimit(columnId, wipLimit);
    } catch (error) {
      console.error("Failed to update WIP limit:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteColumnId) return;
    setIsDeleting(true);
    try {
      await onDeleteColumn(deleteColumnId);
      setDeleteColumnId(null);
    } catch (error) {
      console.error("Failed to delete column:", error);
      setIsDeleting(false);
    }
  };

  const deleteColumn = board.columns.find(c => c.id === deleteColumnId);
  const ticketsInDeleteColumn = board.tickets.filter(t => t.columnId === deleteColumnId).length;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/70"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Board Settings</h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 px-6 dark:border-neutral-700">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("columns")}
                className={clsx(
                  "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition",
                  activeTab === "columns"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
              >
                <Columns className="h-4 w-4" />
                Columns
              </button>
              <button
                onClick={() => setActiveTab("board-info")}
                className={clsx(
                  "flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition",
                  activeTab === "board-info"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                )}
              >
                <Info className="h-4 w-4" />
                Board Info
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            {activeTab === "columns" ? (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Manage Columns</h3>

                {/* Column List */}
                <div className="space-y-2">
                  {board.columns.map((column) => {
                    const ticketCount = board.tickets.filter(t => t.columnId === column.id).length;
                    const isEditing = editingColumnId === column.id;

                    return (
                      <div
                        key={column.id}
                        className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        <GripVertical className="h-4 w-4 text-neutral-400" />

                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleSaveEdit();
                              } else if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                            disabled={isRenaming}
                            className="flex-1 rounded border border-blue-500 bg-white px-2 py-1 text-sm font-medium text-neutral-900 outline-none dark:bg-neutral-950 dark:text-white"
                          />
                        ) : (
                          <>
                            <div className="flex-1">
                              <div className="mb-1">
                                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                  {column.title}
                                </span>
                                <span className="ml-2 text-xs text-neutral-500">
                                  {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-neutral-500" htmlFor={`wip-${column.id}`}>
                                  WIP Limit:
                                </label>
                                <input
                                  id={`wip-${column.id}`}
                                  type="number"
                                  min="1"
                                  placeholder="No limit"
                                  value={column.wipLimit ?? ""}
                                  onChange={(e) => handleWipLimitChange(column.id, e.target.value)}
                                  className="w-20 rounded border border-neutral-300 bg-white px-2 py-0.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-600 dark:bg-neutral-900 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                                />
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStartEdit(column.id, column.title)}
                                className="rounded p-1 text-neutral-400 transition hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                                title="Rename column"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteColumnId(column.id)}
                                disabled={board.columns.length === 1}
                                className="rounded p-1 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950 dark:hover:text-red-400"
                                title={board.columns.length === 1 ? "Cannot delete the last column" : "Delete column"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Column Form */}
                <form onSubmit={handleCreateColumn} className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="New column name"
                      disabled={isCreating}
                      className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:focus:border-blue-400"
                    />
                    <button
                      type="submit"
                      disabled={!newColumnTitle.trim() || isCreating}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Column
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Board Information</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Board Name
                    </label>
                    <p className="mt-1 text-sm text-neutral-900 dark:text-white">{board.name}</p>
                  </div>

                  {board.description && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Description
                      </label>
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{board.description}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Statistics
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.tickets.length}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Total Tickets</div>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.columns.length}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Columns</div>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.members.length}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Members</div>
                      </div>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.sprints.length}</div>
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">Sprints</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
            <button
              onClick={onClose}
              className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteColumnId}
        title="Delete Column"
        message={`Are you sure you want to delete "${deleteColumn?.title}"? ${ticketsInDeleteColumn > 0 ? `This column contains ${ticketsInDeleteColumn} ticket${ticketsInDeleteColumn > 1 ? 's' : ''} that will be moved to the first column.` : 'This action cannot be undone.'}`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteColumnId(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
