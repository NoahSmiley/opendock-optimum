import { useEffect, useState, useCallback } from "react";
import { useNotesStore } from "@/stores/notes/store";
import { createNote, deleteNote, createCollection, updateCollection, deleteCollection, fetchCollectionNotes } from "@/stores/notes/actions";
import { NotesSidebar } from "@/components/notes/NotesSidebar";
import { NotesDashboard } from "@/components/notes/NotesDashboard";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { CollectionView } from "@/components/notes/CollectionView";
import { CollectionDialog } from "@/components/notes/CollectionDialog";
import type { Note, Collection, CreateCollectionInput, UpdateCollectionInput } from "@/stores/notes/types";

export function NotesPage() {
  const { notes, collections, selectedNote, activeCollection, fetchNotes, fetchCollections, selectNote, selectCollection } = useNotesStore();
  const [collectionNotes, setCollectionNotes] = useState<Note[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => { fetchNotes(); fetchCollections(); }, [fetchNotes, fetchCollections]);

  useEffect(() => {
    if (activeCollection) {
      fetchCollectionNotes(activeCollection.id).then(setCollectionNotes);
    } else {
      setCollectionNotes([]);
    }
  }, [activeCollection]);

  const displayedNotes = activeCollection ? collectionNotes : notes;
  const filteredNotes = selectedTag ? displayedNotes.filter((n) => (n.tags ?? []).includes(selectedTag)) : displayedNotes;

  const handleCreateNote = useCallback(async () => {
    const note = await createNote({ title: "Untitled", contentType: "richtext" });
    selectNote(note);
  }, [selectNote]);

  const handleDeleteNote = useCallback(async (noteId: string) => { await deleteNote(noteId); }, []);

  const handleCreateNotebook = () => {
    setEditingCollection(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (data: CreateCollectionInput | UpdateCollectionInput) => {
    if (dialogMode === "create") await createCollection(data as CreateCollectionInput);
    else if (editingCollection) await updateCollection(editingCollection.id, data as UpdateCollectionInput);
  };

  const handleDeleteCollection = async (id: string) => {
    await deleteCollection(id);
    setDialogOpen(false);
  };

  return (
    <div className="notes-page">
      <NotesSidebar
        notes={filteredNotes} selectedNote={selectedNote} onSelectNote={selectNote}
        onCreateNote={handleCreateNote} collections={collections}
        activeCollection={activeCollection} onSelectCollection={selectCollection}
        onCreateCollection={handleCreateNotebook} selectedTag={selectedTag} onSelectTag={setSelectedTag}
      />
      <main className="notes-main">
        <MainContent
          selectedNote={selectedNote} activeCollection={activeCollection}
          collectionNotes={collectionNotes} collections={collections}
          onSelectNote={selectNote} onSelectCollection={selectCollection}
          onCreateNotebook={handleCreateNotebook} onCreateNote={handleCreateNote}
          onDeleteNote={handleDeleteNote}
        />
      </main>
      <CollectionDialog
        isOpen={dialogOpen} onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit} onDelete={handleDeleteCollection}
        collection={editingCollection} mode={dialogMode}
      />
    </div>
  );
}

function MainContent({ selectedNote, activeCollection, collectionNotes, collections,
  onSelectNote, onSelectCollection, onCreateNotebook, onCreateNote, onDeleteNote }: {
  selectedNote: Note | null; activeCollection: Collection | null; collectionNotes: Note[];
  collections: Collection[]; onSelectNote: (n: Note | null) => void;
  onSelectCollection: (c: Collection | null) => void; onCreateNotebook: () => void;
  onCreateNote: () => void; onDeleteNote: (id: string) => void;
}) {
  if (selectedNote) return <NoteEditor key={selectedNote.id} note={selectedNote} onDelete={onDeleteNote} />;
  if (activeCollection) {
    return (
      <CollectionView collection={activeCollection} notes={collectionNotes}
        onSelectNote={onSelectNote} onBack={() => onSelectCollection(null)} onCreateNote={onCreateNote} />
    );
  }
  return <NotesDashboard collections={collections} onSelectCollection={onSelectCollection} onCreateNotebook={onCreateNotebook} />;
}
