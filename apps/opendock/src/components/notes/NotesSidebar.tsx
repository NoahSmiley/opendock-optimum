import { useState } from "react";
import clsx from "clsx";
import { FileText, Plus, Hash } from "lucide-react";
import { SidebarNotesList } from "./SidebarNotesList";
import type { Note, Collection } from "@/stores/notes/types";

interface NotesSidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  collections: Collection[];
  activeCollection: Collection | null;
  onSelectCollection: (collection: Collection | null) => void;
  onCreateCollection: () => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function NotesSidebar({
  notes, selectedNote, onSelectNote, onCreateNote,
  collections, activeCollection, onSelectCollection, onCreateCollection,
  selectedTag, onSelectTag,
}: NotesSidebarProps) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : notes;
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const allTags = extractTags(notes);

  return (
    <aside className="notes-sidebar">
      <div className="notes-sidebar-content">
        <SidebarHeader onCreateNote={onCreateNote} search={search} onSearchChange={setSearch} />
        <CollectionsSection
          collections={collections} activeCollection={activeCollection}
          onSelect={onSelectCollection} onCreate={onCreateCollection}
        />
        {allTags.length > 0 && (
          <TagsSection tags={allTags} selectedTag={selectedTag} onSelect={onSelectTag} />
        )}
        <SidebarNotesList notes={sorted} selectedNote={selectedNote} onSelect={onSelectNote} />
      </div>
    </aside>
  );
}

function SidebarHeader({ onCreateNote, search, onSearchChange }: {
  onCreateNote: () => void; search: string; onSearchChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Notes</span>
        <button onClick={onCreateNote}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>
      <input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search notes..."
        className="w-full rounded-lg border border-neutral-800/60 bg-neutral-900/50 px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none" />
    </div>
  );
}

function CollectionsSection({ collections, activeCollection, onSelect, onCreate }: {
  collections: Collection[]; activeCollection: Collection | null;
  onSelect: (c: Collection | null) => void; onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Notebooks</span>
        <button onClick={onCreate} className="rounded p-0.5 text-neutral-600 transition-colors hover:text-neutral-300">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button onClick={() => onSelect(null)}
        className={clsx("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
          !activeCollection ? "bg-neutral-800/80 text-white" : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200")}>
        <FileText className="h-3.5 w-3.5 shrink-0 text-neutral-500" /> All Notes
      </button>
      {collections.map((c) => (
        <button key={c.id} onClick={() => onSelect(c)}
          className={clsx("flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
            activeCollection?.id === c.id ? "bg-neutral-800/80 text-white" : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200")}>
          <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ backgroundColor: c.color ?? "#6366f1" }} />
          <span className="truncate">{c.name}</span>
          {c.noteCount !== undefined && (
            <span className="ml-auto shrink-0 text-[11px] text-neutral-600">{c.noteCount}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function TagsSection({ tags, selectedTag, onSelect }: {
  tags: string[]; selectedTag: string | null; onSelect: (t: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Tags</span>
      <div className="flex flex-wrap gap-1.5">
        {tags.slice(0, 12).map((t) => (
          <button key={t} onClick={() => onSelect(selectedTag === t ? null : t)}
            className={clsx("flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
              selectedTag === t
                ? "border-neutral-600 bg-neutral-800 text-white"
                : "border-neutral-800/60 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300")}>
            <Hash className="h-2.5 w-2.5" />{t}
          </button>
        ))}
      </div>
    </div>
  );
}

function extractTags(notes: Note[]): string[] {
  const counts = new Map<string, number>();
  for (const n of notes) for (const t of n.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}
