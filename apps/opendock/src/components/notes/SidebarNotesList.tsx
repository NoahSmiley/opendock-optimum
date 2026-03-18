import clsx from "clsx";
import { Pin } from "lucide-react";
import type { Note } from "@/stores/notes/types";

interface SidebarNotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelect: (n: Note) => void;
}

export function SidebarNotesList({ notes, selectedNote, onSelect }: SidebarNotesListProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Pages</span>
      {notes.map((n) => (
        <button key={n.id} onClick={() => onSelect(n)}
          className={clsx("flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
            selectedNote?.id === n.id ? "bg-neutral-800/80 text-white" : "text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200")}>
          {n.isPinned && <Pin className="h-3 w-3 shrink-0 text-amber-400/70" />}
          <div className="min-w-0 flex-1">
            <span className="block truncate font-medium">{n.title || "Untitled"}</span>
            <span className="block truncate text-[11px] text-neutral-600">
              {formatRelative(n.updatedAt)}
            </span>
          </div>
        </button>
      ))}
      {notes.length === 0 && <p className="px-2.5 py-4 text-xs text-neutral-600">No notes yet.</p>}
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
