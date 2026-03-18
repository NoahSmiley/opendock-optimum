import { useState, useCallback, useRef, useEffect } from "react";
import { Pin, Trash2, ChevronDown, ChevronRight, Clock } from "lucide-react";
import clsx from "clsx";
import { RichTextEditor } from "./RichTextEditor";
import { updateNote } from "@/stores/notes/actions";
import type { Note } from "@/stores/notes/types";

interface NoteEditorProps {
  note: Note;
  onDelete: (noteId: string) => void;
}

export function NoteEditor({ note, onDelete }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [showDetails, setShowDetails] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setTitle(note.title); }, [note.id, note.title]);

  const debouncedSave = useCallback((field: string, value: string) => {
    clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      await updateNote(note.id, { [field]: value });
      setSaveStatus("saved");
    }, 1500);
  }, [note.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    debouncedSave("title", e.target.value);
  };

  const handleContentChange = useCallback((content: string) => {
    debouncedSave("content", content);
  }, [debouncedSave]);

  return (
    <div className="flex h-full flex-col">
      <EditorHeader
        title={title} onTitleChange={handleTitleChange} saveStatus={saveStatus}
        isPinned={note.isPinned} noteId={note.id} onDelete={() => onDelete(note.id)}
      />
      <DetailToggle open={showDetails} onToggle={() => setShowDetails(!showDetails)} note={note} />
      {showDetails && <NoteDetails note={note} />}
      <div className="flex-1 overflow-hidden">
        <RichTextEditor key={note.id} initialContent={note.content} onChange={handleContentChange} />
      </div>
    </div>
  );
}

function EditorHeader({ title, onTitleChange, saveStatus, isPinned, noteId, onDelete }: {
  title: string; onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveStatus: string; isPinned: boolean; noteId: string; onDelete: () => void;
}) {
  const handleTogglePin = async () => { await updateNote(noteId, { isPinned: !isPinned }); };
  return (
    <div className="shrink-0 px-10 pt-8 pb-4">
      <div className="flex items-start justify-between gap-4">
        <input value={title} onChange={onTitleChange} placeholder="Untitled"
          className="flex-1 border-none bg-transparent p-0 text-2xl font-bold text-white outline-none placeholder:text-neutral-700 focus:ring-0" />
        <div className="flex items-center gap-1 pt-1">
          {saveStatus !== "idle" && (
            <span className="mr-1 text-[11px] text-neutral-600">{saveStatus === "saving" ? "Saving..." : "Saved"}</span>
          )}
          <button onClick={handleTogglePin} className={clsx("rounded-md p-1.5 transition-colors",
            isPinned ? "text-amber-400" : "text-neutral-600 hover:text-neutral-300")}>
            <Pin className="h-4 w-4" />
          </button>
          <button onClick={onDelete}
            className="rounded-md p-1.5 text-neutral-600 transition-colors hover:text-red-400">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailToggle({ open, onToggle, note }: { open: boolean; onToggle: () => void; note: Note }) {
  return (
    <button onClick={onToggle}
      className="mx-10 flex items-center gap-2 border-t border-neutral-800/40 py-2.5 text-xs text-neutral-500 transition-colors hover:text-neutral-400">
      {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      <span className="font-medium">Details</span>
      <span className="flex items-center gap-1 text-[11px] text-neutral-600">
        <Clock className="h-3 w-3" /> {new Date(note.updatedAt).toLocaleDateString()}
      </span>
    </button>
  );
}

function NoteDetails({ note }: { note: Note }) {
  return (
    <div className="mx-10 space-y-3 border-t border-neutral-800/40 py-4">
      <div>
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Tags</span>
        <div className="flex flex-wrap gap-1.5">
          {(note.tags ?? []).map((t) => (
            <span key={t} className="rounded-md border border-neutral-800/60 bg-neutral-800/30 px-2 py-0.5 text-xs text-neutral-400">{t}</span>
          ))}
          {(note.tags ?? []).length === 0 && <span className="text-xs text-neutral-600">No tags</span>}
        </div>
      </div>
      <div className="flex gap-6 text-[11px] text-neutral-600">
        <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
        <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
