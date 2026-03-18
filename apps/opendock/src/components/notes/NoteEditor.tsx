import { useState, useCallback, useRef, useEffect } from "react";
import { Pin, Trash2 } from "lucide-react";
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
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "idle">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { setTitle(note.title); }, [note.id, note.title]);

  const debouncedSave = useCallback((field: string, value: string) => {
    clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        await updateNote(note.id, { [field]: value });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 1500);
  }, [note.id]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    debouncedSave("title", e.target.value);
  };

  const handleContentChange = useCallback((content: string) => {
    debouncedSave("content", content);
  }, [debouncedSave]);

  const handleTogglePin = async () => { await updateNote(note.id, { isPinned: !note.isPinned }); };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-10 pt-10 pb-4">
        <div className="flex items-start justify-between gap-4">
          <input value={title} onChange={handleTitleChange} placeholder="Untitled"
            className="flex-1 border-none bg-transparent p-0 text-xl font-semibold text-white outline-none placeholder:text-neutral-700 focus:ring-0" />
          <div className="flex items-center gap-0.5 pt-0.5">
            {saveStatus !== "idle" && (
              <span className={`mr-1.5 text-[10px] ${saveStatus === "error" ? "text-red-400" : "text-neutral-600"}`}>
                {saveStatus === "saving" ? "Saving" : saveStatus === "error" ? "Failed" : "Saved"}
              </span>
            )}
            <button onClick={handleTogglePin} className={clsx("rounded-md p-1.5 transition-colors",
              note.isPinned ? "text-amber-400/80" : "text-neutral-600 hover:text-neutral-400")}>
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onDelete(note.id)}
              className="rounded-md p-1.5 text-neutral-600 transition-colors hover:text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
      <NoteMetaBar note={note} />
      <div className="flex-1 overflow-hidden">
        <RichTextEditor key={note.id} initialContent={note.content} onChange={handleContentChange} />
      </div>
    </div>
  );
}

function NoteMetaBar({ note }: { note: Note }) {
  const tags = note.tags ?? [];
  return (
    <div className="mx-10 flex items-center gap-3 border-t border-white/[0.04] py-2.5 text-[10px] text-neutral-600">
      <span>{new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      {tags.length > 0 && (
        <div className="flex items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="rounded-md border border-white/[0.06] px-1.5 py-px text-neutral-500">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
