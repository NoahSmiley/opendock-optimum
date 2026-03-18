import { FileText, Plus, ArrowLeft } from "lucide-react";
import type { Note, Collection } from "@/stores/notes/types";

interface CollectionViewProps {
  collection: Collection;
  notes: Note[];
  onSelectNote: (note: Note) => void;
  onBack: () => void;
  onCreateNote: () => void;
}

export function CollectionView({ collection, notes, onSelectNote, onBack, onCreateNote }: CollectionViewProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-10 pt-8 pb-6">
        <button onClick={onBack}
          className="mb-4 flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-300">
          <ArrowLeft className="h-3.5 w-3.5" /> All Notebooks
        </button>
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 rounded" style={{ backgroundColor: collection.color ?? "#6366f1" }} />
          <h1 className="text-xl font-bold text-white">{collection.name}</h1>
        </div>
        {collection.description && (
          <p className="mt-1.5 text-sm text-neutral-500">{collection.description}</p>
        )}
        <p className="mt-2 text-xs text-neutral-600">{notes.length} page{notes.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex-1 px-10 pb-10">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <FileText className="mb-3 h-10 w-10 text-neutral-700" />
            <p className="mb-1 text-sm font-medium text-neutral-400">No pages yet</p>
            <p className="mb-4 text-xs">Create a note and add it to this notebook.</p>
            <button onClick={onCreateNote}
              className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white">
              <Plus className="h-3.5 w-3.5" /> New Note
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {notes.map((n) => (
              <button key={n.id} onClick={() => onSelectNote(n)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-neutral-800/40">
                <FileText className="h-4 w-4 shrink-0 text-neutral-600" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-neutral-200">{n.title || "Untitled"}</span>
                  <span className="block text-[11px] text-neutral-600">
                    {new Date(n.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                {(n.tags ?? []).length > 0 && (
                  <span className="shrink-0 text-[11px] text-neutral-600">{(n.tags ?? []).length} tag{(n.tags ?? []).length !== 1 ? "s" : ""}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
