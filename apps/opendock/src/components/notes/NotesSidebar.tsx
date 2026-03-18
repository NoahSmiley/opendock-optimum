import { useState, useMemo } from "react";
import clsx from "clsx";
import { Plus, Pin } from "lucide-react";
import type { Note } from "@/stores/notes/types";

interface NotesSidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
}

export function NotesSidebar({ notes, selectedNote, onSelectNote, onCreateNote }: NotesSidebarProps) {
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    const filtered = search
      ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
      : notes;
    return [...filtered].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, search]);

  return (
    <aside className="notes-sidebar">
      <div className="notes-sidebar-content">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Notes</span>
            <button onClick={onCreateNote}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-neutral-500 transition-colors hover:bg-white/[0.04] hover:text-neutral-300">
              <Plus className="h-3 w-3" /> New
            </button>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="w-full rounded-md border border-white/[0.06] bg-transparent px-2.5 py-1.5 text-[12px] text-white placeholder:text-neutral-600 focus:border-white/[0.12] focus:outline-none" />
        </div>
        <div className="flex flex-col gap-px">
          {sorted.map((n) => (
            <NoteItem key={n.id} note={n} isSelected={selectedNote?.id === n.id} onSelect={onSelectNote} />
          ))}
          {sorted.length === 0 && <p className="px-2 py-4 text-[11px] text-neutral-600">No notes yet.</p>}
        </div>
      </div>
    </aside>
  );
}

function NoteItem({ note, isSelected, onSelect }: { note: Note; isSelected: boolean; onSelect: (n: Note) => void }) {
  return (
    <button onClick={() => onSelect(note)}
      className={clsx("flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] transition-colors",
        isSelected ? "bg-white/[0.05] text-neutral-200" : "text-neutral-500 hover:bg-white/[0.03] hover:text-neutral-300")}>
      {note.isPinned && <Pin className="h-2.5 w-2.5 shrink-0 text-amber-400/60" />}
      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium">{note.title || "Untitled"}</span>
        <span className="block truncate text-[10px] text-neutral-600">{formatRelative(note.updatedAt)}</span>
      </div>
    </button>
  );
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
