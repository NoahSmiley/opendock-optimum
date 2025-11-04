import { useState, useEffect } from 'react';
import { ThemeProvider } from './theme-provider';
import { useNotesData, useCollections } from './hooks';
import { NotesLayout, NotesSidebar, EmptyState, NoteEditor, QuickNoteModal, QuickNoteButton } from './components';
import { CollectionDialog } from './components/collections';
import { Dashboard } from './components/dashboard';
import { collectionsApi } from './lib/api';
import type { Collection, CreateCollectionInput, UpdateCollectionInput } from '@opendock/shared/types';

function NotesApp() {
  const [isDashboardView, setIsDashboardView] = useState(true);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const [collectionDialogMode, setCollectionDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionNotes, setCollectionNotes] = useState<typeof notes>([]);

  const {
    notes,
    selectedNote,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
  } = useNotesData();

  const {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    getCollectionNotes,
  } = useCollections();

  // Global keyboard shortcut for quick note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickNoteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled Note',
        content: '',
        contentType: 'markdown',
        tags: [],
      });

      // If we're in a collection, automatically add the note to it
      if (selectedCollectionId) {
        try {
          await collectionsApi.addNote(selectedCollectionId, newNote.id);
          // Add to local state
          setCollectionNotes(prev => [newNote, ...prev]);
        } catch (error) {
          console.error('Failed to add note to collection:', error);
        }
      }

      selectNote(newNote);
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  const handleQuickNoteCreate = async (input: Parameters<typeof createNote>[0]) => {
    try {
      const newNote = await createNote(input);
      selectNote(newNote);
    } catch (err) {
      console.error('Failed to create quick note:', err);
      throw err;
    }
  };

  const handleSelectNote = (note: typeof notes[number]) => {
    selectNote(note);
    setIsDashboardView(false);
  };

  const handleUpdateNote = async (noteId: string, updates: Parameters<typeof updateNote>[1]) => {
    return await updateNote(noteId, updates);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
  };

  const handleCreateCollection = () => {
    setCollectionDialogMode('create');
    setEditingCollection(null);
    setIsCollectionDialogOpen(true);
  };

  const handleSelectCollection = async (collection: Collection) => {
    setSelectedCollectionId(collection.id);
    setIsDashboardView(false);
    try {
      const collNotes = await getCollectionNotes(collection.id);
      setCollectionNotes(collNotes);
    } catch (error) {
      console.error('Failed to load collection notes:', error);
    }
  };

  const handleClearCollectionFilter = () => {
    setSelectedCollectionId(null);
    setCollectionNotes([]);
  };

  const handleCollectionDialogSubmit = async (data: CreateCollectionInput | UpdateCollectionInput) => {
    if (collectionDialogMode === 'create') {
      await createCollection(data as CreateCollectionInput);
    } else if (editingCollection) {
      await updateCollection(editingCollection.id, data as UpdateCollectionInput);
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setCollectionDialogMode('edit');
    setEditingCollection(collection);
    setIsCollectionDialogOpen(true);
  };

  const handleDeleteCollection = async (collectionId: string) => {
    try {
      await deleteCollection(collectionId);
      // If we're currently viewing this collection, clear the filter
      if (selectedCollectionId === collectionId) {
        handleClearCollectionFilter();
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">Error</h2>
          <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
        </div>
      </div>
    );
  }

  // Determine which notes to display and get current collection
  const displayedNotes = selectedCollectionId ? collectionNotes : notes;
  const currentCollection = selectedCollectionId
    ? collections.find(c => c.id === selectedCollectionId) || null
    : null;

  return (
    <>
      <NotesLayout
        sidebar={
          <NotesSidebar
            notes={displayedNotes}
            selectedNote={selectedNote}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            collections={collections}
            currentCollection={currentCollection}
            onSelectCollection={handleSelectCollection}
            onCreateCollection={handleCreateCollection}
            onEditCollection={handleEditCollection}
            onDeleteCollection={handleDeleteCollection}
            onClearCollectionFilter={handleClearCollectionFilter}
            isDashboardView={isDashboardView}
            onDashboardClick={() => setIsDashboardView(true)}
          />
        }
      >
        {isDashboardView ? (
          <Dashboard notes={notes} collections={collections} onSelectNote={handleSelectNote} />
        ) : isLoading && !selectedNote ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-neutral-400 dark:text-neutral-500">Loading...</div>
          </div>
        ) : selectedNote ? (
          <NoteEditor
            note={selectedNote}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
            allCollections={collections}
            currentCollection={currentCollection}
          />
        ) : (
          <EmptyState onCreateNote={handleCreateNote} />
        )}
      </NotesLayout>

      {/* Quick Note Components */}
      <QuickNoteButton onClick={() => setIsQuickNoteOpen(true)} />
      <QuickNoteModal
        isOpen={isQuickNoteOpen}
        onClose={() => setIsQuickNoteOpen(false)}
        onCreateNote={handleQuickNoteCreate}
      />

      {/* Collection Dialog */}
      <CollectionDialog
        isOpen={isCollectionDialogOpen}
        onClose={() => setIsCollectionDialogOpen(false)}
        onSubmit={handleCollectionDialogSubmit}
        onDelete={handleDeleteCollection}
        collection={editingCollection}
        mode={collectionDialogMode}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NotesApp />
    </ThemeProvider>
  );
}

export default App;
