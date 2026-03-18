import { useState } from "react";
import { X } from "lucide-react";
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from "@/stores/notes/types";

interface CollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCollectionInput | UpdateCollectionInput) => Promise<void>;
  onDelete?: (collectionId: string) => void;
  collection?: Collection | null;
  mode: "create" | "edit";
}

const COLORS = [
  "#1a1a1a", "#2d2d2d", "#404040", "#5c4033", "#8b6914", "#1e3a5f",
  "#1b4d3e", "#4a5568", "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f59e0b", "#10b981", "#3b82f6", "#6b7280",
];

const PATTERNS: Array<{ id: string; label: string }> = [
  { id: "solid", label: "Solid" }, { id: "grid", label: "Grid" },
  { id: "dots", label: "Dots" }, { id: "lines", label: "Lines" },
];

export function CollectionDialog({ isOpen, onClose, onSubmit, onDelete, collection, mode }: CollectionDialogProps) {
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [color, setColor] = useState(collection?.color ?? "#6366f1");
  const [pattern, setPattern] = useState<string>(collection?.coverPattern ?? "solid");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onSubmit({ name: name.trim(), description: description.trim() || undefined, color, coverPattern: pattern });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl border border-neutral-800/60 bg-neutral-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-neutral-600 transition-colors hover:text-neutral-300">
          <X className="h-4 w-4" />
        </button>
        <h2 className="mb-5 text-lg font-semibold text-white">
          {mode === "create" ? "Create Notebook" : "Edit Notebook"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Notebook"
              className="w-full rounded-lg border border-neutral-800/60 bg-neutral-800/40 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none" />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description..."
              className="w-full rounded-lg border border-neutral-800/60 bg-neutral-800/40 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:border-neutral-600 focus:outline-none" />
          </Field>
          <Field label="Color">
            <div className="grid grid-cols-8 gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="h-7 w-7 rounded-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? "2px solid #a0a0a8" : "none", outlineOffset: "2px" }} />
              ))}
            </div>
          </Field>
          <Field label="Pattern">
            <div className="grid grid-cols-4 gap-2">
              {PATTERNS.map((p) => (
                <button key={p.id} type="button" onClick={() => setPattern(p.id)}
                  className={`flex h-9 items-center justify-center rounded-lg border text-xs font-medium transition-colors
                    ${pattern === p.id ? "border-neutral-600 bg-neutral-800 text-white" : "border-neutral-800/60 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="flex items-center justify-between gap-2 pt-2">
            {mode === "edit" && collection && onDelete ? (
              <button type="button" onClick={() => onDelete(collection.id)}
                className="rounded-lg px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/20">Delete</button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="rounded-lg px-4 py-2 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-200">Cancel</button>
              <button type="submit" disabled={!name.trim() || saving}
                className="rounded-lg bg-white px-4 py-2 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-200 disabled:opacity-50">
                {mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</label>
      {children}
    </div>
  );
}
