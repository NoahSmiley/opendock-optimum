import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createLabel } from "@/stores/boards/actions";
import type { Board } from "@/stores/boards/types";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

interface LabelSettingsProps {
  board: Board;
}

export function LabelSettings({ board }: LabelSettingsProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createLabel(board.id, name.trim(), color);
      setName("");
    } catch (err) {
      console.error("Failed to create label:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-400">Create and manage labels for categorizing tickets.</p>
      {board.labels.length > 0 && (
        <div className="space-y-2">
          {board.labels.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-md border border-neutral-800 bg-neutral-800/50 px-3 py-2.5">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="flex-1 text-sm text-white">{l.name}</span>
              <button className="text-neutral-500 hover:text-red-400 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3 rounded-md border border-neutral-800 bg-neutral-800/30 p-3">
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Label name..." disabled={isCreating}
            className="flex-1 rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500" />
          <button onClick={handleCreate} disabled={!name.trim() || isCreating}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="flex gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full transition ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900" : "hover:scale-110"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}
