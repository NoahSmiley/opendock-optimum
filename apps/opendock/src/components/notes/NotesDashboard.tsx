import { useState } from "react";
import { Search, Plus, BookOpen } from "lucide-react";
import { NotebookCover } from "./NotebookCover";
import type { Collection } from "@/stores/notes/types";

interface NotesDashboardProps {
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
  onCreateNotebook: () => void;
}

export function NotesDashboard({ collections, onSelectCollection, onCreateNotebook }: NotesDashboardProps) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : collections;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="px-10 pt-8 pb-6">
        <h1 className="mb-1 text-xl font-bold text-white">Notebooks</h1>
        <p className="mb-5 text-sm text-neutral-500">{collections.length} notebook{collections.length !== 1 ? "s" : ""}</p>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notebooks..."
            className="w-full rounded-lg border border-neutral-800/60 bg-neutral-900/50 py-2 pl-10 pr-4 text-sm text-white placeholder-neutral-600 focus:border-neutral-700 focus:outline-none" />
        </div>
      </div>

      <div className="flex-1 px-10 pb-10">
        {filtered.length === 0 ? (
          <EmptyState hasSearch={!!search} onCreate={onCreateNotebook} />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
            {filtered.map((c) => (
              <NotebookCover key={c.id} name={c.name} color={c.color} coverPattern={c.coverPattern}
                noteCount={c.noteCount} onClick={() => onSelectCollection(c)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasSearch, onCreate }: { hasSearch: boolean; onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
      <BookOpen className="mb-3 h-10 w-10 text-neutral-700" />
      <p className="mb-1 text-sm font-medium text-neutral-400">
        {hasSearch ? "No notebooks found" : "No notebooks yet"}
      </p>
      <p className="mb-4 text-xs">
        {hasSearch ? "Try a different search term." : "Create your first notebook to get started."}
      </p>
      {!hasSearch && (
        <button onClick={onCreate}
          className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white">
          <Plus className="h-3.5 w-3.5" /> Create Notebook
        </button>
      )}
    </div>
  );
}
