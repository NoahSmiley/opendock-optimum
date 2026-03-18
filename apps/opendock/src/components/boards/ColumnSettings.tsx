import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { createColumn, deleteColumn } from "@/stores/boards/actions";
import type { Board } from "@/stores/boards/types";

interface ColumnSettingsProps {
  board: Board;
}

export function ColumnSettings({ board }: ColumnSettingsProps) {
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const sortedColumns = [...board.columns].sort((a, b) => a.order - b.order);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      await createColumn(board.id, newTitle.trim());
      setNewTitle("");
    } catch (err) {
      console.error("Failed to create column:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (columnId: string) => {
    try {
      await deleteColumn(board.id, columnId);
    } catch (err) {
      console.error("Failed to delete column:", err);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-400">Manage columns for this board. Drag to reorder.</p>
      <div className="space-y-2">
        {sortedColumns.map((col) => (
          <div key={col.id} className="flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-800/50 px-3 py-2.5">
            <GripVertical className="h-4 w-4 shrink-0 text-neutral-600 cursor-grab" />
            <span className="flex-1 text-sm text-white">{col.title}</span>
            {col.wipLimit && (
              <span className="text-xs text-neutral-500">WIP: {col.wipLimit}</span>
            )}
            <button onClick={() => handleDelete(col.id)}
              className="text-neutral-500 hover:text-red-400 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New column name..." disabled={isCreating}
          className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500" />
        <button onClick={handleCreate} disabled={!newTitle.trim() || isCreating}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}
