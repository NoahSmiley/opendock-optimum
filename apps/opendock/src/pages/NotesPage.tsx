import { useEffect, useCallback } from "react";
import { useNotesStore } from "@/stores/notes/store";
import { createNote, deleteNote } from "@/stores/notes/actions";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NoteEditor } from "@/components/notes/NoteEditor";

export function NotesPage() {
  const { notes, selectedNote, fetchNotes, selectNote } = useNotesStore();

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleCreateNote = useCallback(async () => {
    const note = await createNote({ title: "Untitled", contentType: "richtext" });
    selectNote(note);
  }, [selectNote]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
  }, []);

  return (
    <div className="notes-page">
      <NotesSidebar
        notes={notes} selectedNote={selectedNote}
        onSelectNote={selectNote} onCreateNote={handleCreateNote}
      />
      <main className="notes-main">
        {selectedNote ? (
          <NoteEditor key={selectedNote.id} note={selectedNote} onDelete={handleDeleteNote} />
        ) : (
          <EmptyState onCreateNote={handleCreateNote} />
        )}
      </main>
    </div>
  );
}

function EmptyState({ onCreateNote }: { onCreateNote: () => void }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-[13px] text-neutral-500">No note selected</p>
        <button onClick={onCreateNote}
          className="mt-3 text-[12px] text-neutral-400 transition-colors hover:text-white">
          Create a note
        </button>
      </div>
    </div>
  );
}
