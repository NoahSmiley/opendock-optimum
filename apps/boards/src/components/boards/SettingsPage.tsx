import { useState, useRef, useEffect } from "react";
import { Plus, GripVertical, Pencil, Trash2, Columns, Info, Tag } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard } from "@opendock/shared/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LabelManager } from "./LabelManager";

type SettingsTab = "columns" | "labels" | "board-info";

interface SettingsPageProps {
  board: KanbanBoard;
  onCreateColumn: (title: string) => Promise<void>;
  onRenameColumn: (columnId: string, newTitle: string) => Promise<void>;
  onDeleteColumn: (columnId: string) => Promise<void>;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onUpdateLabel: (labelId: string, name: string, color: string) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
}

export function SettingsPage({
  board,
  onCreateColumn,
  onRenameColumn,
  onDeleteColumn,
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: SettingsPageProps) {
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

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Board Settings</h1>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Manage your board configuration and columns
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("columns")}
                  className={clsx(
                    "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition",
                    activeTab === "columns"
                      ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                      : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  )}
                >
                  <Columns className="h-4 w-4" />
                  Columns
                </button>
                <button
                  onClick={() => setActiveTab("labels")}
                  className={clsx(
                    "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition",
                    activeTab === "labels"
                      ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                      : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  )}
                >
                  <Tag className="h-4 w-4" />
                  Labels
                </button>
                <button
                  onClick={() => setActiveTab("board-info")}
                  className={clsx(
                    "flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition",
                    activeTab === "board-info"
                      ? "border-neutral-900 text-neutral-900 dark:border-white dark:text-white"
                      : "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  )}
                >
                  <Info className="h-4 w-4" />
                  Board Info
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div>
            {activeTab === "columns" && (
              <div className="space-y-6">
                {/* Column List */}
                <div className="space-y-3">
                  {board.columns.map((column) => {
                    const ticketCount = board.tickets.filter(t => t.columnId === column.id).length;
                    const isEditing = editingColumnId === column.id;

                    return (
                      <div
                        key={column.id}
                        className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                      >
                        <GripVertical className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />

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
                            className="flex-1 rounded-md border border-neutral-900 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none dark:border-white dark:bg-neutral-950 dark:text-white"
                          />
                        ) : (
                          <>
                            <div className="flex flex-1 items-baseline gap-3">
                              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {column.title}
                              </span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {ticketCount} ticket{ticketCount !== 1 ? 's' : ''}
                              </span>
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStartEdit(column.id, column.title)}
                                className="rounded-md p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white"
                                title="Rename column"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteColumnId(column.id)}
                                disabled={board.columns.length === 1}
                                className="rounded-md p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
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
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
                  <form onSubmit={handleCreateColumn} className="flex gap-3">
                    <input
                      type="text"
                      value={newColumnTitle}
                      onChange={(e) => setNewColumnTitle(e.target.value)}
                      placeholder="New column name..."
                      disabled={isCreating}
                      className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white/10"
                    />
                    <button
                      type="submit"
                      disabled={!newColumnTitle.trim() || isCreating}
                      className="flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "labels" && (
              <LabelManager
                labels={board.labels}
                onCreateLabel={onCreateLabel}
                onUpdateLabel={onUpdateLabel}
                onDeleteLabel={onDeleteLabel}
              />
            )}

            {activeTab === "board-info" && (
              <div className="space-y-6">
                {/* Board Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Board Name
                    </label>
                    <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{board.name}</p>
                  </div>

                  {board.description && (
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        Description
                      </label>
                      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{board.description}</p>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div>
                  <label className="mb-4 block text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Statistics
                  </label>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.tickets.length}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Tickets</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.columns.length}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Columns</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.members.length}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Members</div>
                    </div>
                    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                      <div className="text-2xl font-bold text-neutral-900 dark:text-white">{board.sprints.length}</div>
                      <div className="mt-1 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Sprints</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
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
