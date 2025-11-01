import { useState } from "react";
import { Plus, Pencil, Trash2, Tag, X, Check } from "lucide-react";
import clsx from "clsx";
import type { KanbanLabel } from "@opendock/shared/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface LabelManagerProps {
  labels: KanbanLabel[];
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onUpdateLabel: (labelId: string, name: string, color: string) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
}

const LABEL_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Gray", value: "#6b7280" },
];

export function LabelManager({
  labels = [],
  onCreateLabel,
  onUpdateLabel,
  onDeleteLabel,
}: LabelManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteLabelId, setDeleteLabelId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    setIsCreating(true);
    try {
      await onCreateLabel(newLabelName.trim(), newLabelColor);
      setNewLabelName("");
      setNewLabelColor(LABEL_COLORS[0].value);
    } catch (error) {
      console.error("Failed to create label:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (label: KanbanLabel) => {
    setEditingLabelId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const handleSaveEdit = async () => {
    if (!editingLabelId || !editName.trim()) {
      setEditingLabelId(null);
      return;
    }

    const currentLabel = labels.find((l) => l.id === editingLabelId);
    if (currentLabel && editName === currentLabel.name && editColor === currentLabel.color) {
      setEditingLabelId(null);
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateLabel(editingLabelId, editName.trim(), editColor);
      setEditingLabelId(null);
    } catch (error) {
      console.error("Failed to update label:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLabelId(null);
    setEditName("");
    setEditColor("");
  };

  const handleDeleteConfirm = async () => {
    if (!deleteLabelId) return;
    setIsDeleting(true);
    try {
      await onDeleteLabel(deleteLabelId);
      setDeleteLabelId(null);
    } catch (error) {
      console.error("Failed to delete label:", error);
      setIsDeleting(false);
    }
  };

  const deleteLabel = labels.find((l) => l.id === deleteLabelId);

  return (
    <>
      <div className="space-y-6">
        {/* Label List */}
        {labels.length > 0 ? (
          <div className="space-y-3">
            {labels.map((label) => {
              const isEditing = editingLabelId === label.id;

              return (
                <div
                  key={label.id}
                  className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                >
                  {isEditing ? (
                    <>
                      <div className="flex flex-1 gap-3">
                        <div className="grid grid-cols-6 gap-2">
                          {LABEL_COLORS.map((colorOption) => (
                            <button
                              key={colorOption.value}
                              type="button"
                              onClick={() => setEditColor(colorOption.value)}
                              className={clsx(
                                "h-8 w-8 rounded-md transition hover:scale-110",
                                editColor === colorOption.value && "ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900"
                              )}
                              style={{ backgroundColor: colorOption.value }}
                              title={colorOption.name}
                            />
                          ))}
                        </div>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          disabled={isUpdating}
                          className="flex-1 rounded-md border border-neutral-900 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none dark:border-white dark:bg-neutral-950 dark:text-white"
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={handleSaveEdit}
                          disabled={isUpdating}
                          className="rounded-md p-2 text-green-600 transition hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-950/50"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                          className="rounded-md p-2 text-neutral-400 transition hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-800"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div
                        className="h-6 w-6 rounded"
                        style={{ backgroundColor: label.color }}
                        title={label.color}
                      />
                      <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-white">
                        {label.name}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartEdit(label)}
                          className="rounded-md p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white"
                          title="Edit label"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteLabelId(label.id)}
                          className="rounded-md p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 dark:text-neutral-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                          title="Delete label"
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
        ) : (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
            <Tag className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-600" />
            <p className="mt-2 text-sm font-medium text-neutral-900 dark:text-white">No labels yet</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Create labels to categorize and organize your tickets
            </p>
          </div>
        )}

        {/* Add Label Form */}
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
          <form onSubmit={handleCreateLabel} className="space-y-3">
            <div className="grid grid-cols-6 gap-2">
              {LABEL_COLORS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setNewLabelColor(colorOption.value)}
                  className={clsx(
                    "h-8 w-8 rounded-md transition hover:scale-110",
                    newLabelColor === colorOption.value && "ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900"
                  )}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="New label name..."
                disabled={isCreating}
                className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-white dark:focus:ring-white/10"
              />
              <button
                type="submit"
                disabled={!newLabelName.trim() || isCreating}
                className="flex items-center gap-2 rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteLabelId !== null}
        title="Delete Label"
        message={
          deleteLabel
            ? `Are you sure you want to delete "${deleteLabel.name}"? This label will be removed from all tickets.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteLabelId(null)}
        isLoading={isDeleting}
      />
    </>
  );
}
