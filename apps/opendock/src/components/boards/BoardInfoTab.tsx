import { useState } from "react";
import { updateBoard, deleteBoard } from "@/stores/boards/actions";
import type { Board } from "@/stores/boards/types";

interface BoardInfoTabProps {
  board: Board;
  onClose: () => void;
}

export function BoardInfoTab({ board, onClose }: BoardInfoTabProps) {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = name !== board.name || description !== (board.description ?? "");

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateBoard(board.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await deleteBoard(board.id);
    onClose();
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-400">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-400">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Optional description..."
          className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-400">Created</label>
        <p className="text-sm text-neutral-400">
          {new Date(board.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>
      {dirty && (
        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}
      <div className="border-t border-neutral-800 pt-5">
        <h3 className="mb-2 text-sm font-semibold text-red-400">Danger Zone</h3>
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            className="rounded-md border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10">
            Delete Board
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-400">Delete "{board.name}" and all its data?</span>
            <button onClick={handleDelete}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500">
              Confirm Delete
            </button>
            <button onClick={() => setConfirmDelete(false)}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-400 transition hover:text-white">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
