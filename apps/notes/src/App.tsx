import { useState, useEffect } from 'react';
import { Copy, Archive, Download } from 'lucide-react';
import { ThemeProvider } from './theme-provider';
import { useNotesData, useCollections, useTags, useKeyboardShortcuts } from './hooks';
import { NotesLayout, NotesSidebar } from './components';
import { CollectionDialog } from './components/collections';
import { Dashboard } from './components/dashboard';
import { NotebookViewer } from './components/notebook';
import { KeyboardShortcutsDialog } from './components/shortcuts';
import { CommandPalette } from './components/command';
import { TemplatePickerDialog } from './components/templates';
import { processTemplateContent } from './lib/templates';
import { exportNoteToPDF, exportNoteToMarkdown, downloadMarkdown } from './lib/export';
import { notesApi } from './lib/api';
import type { Collection, CreateCollectionInput, UpdateCollectionInput, Note } from '@opendock/shared/types';

function NotesApp() {
  const [selectedNotebook, setSelectedNotebook] = useState<Collection | null>(null);
  const [isNotebookDialogOpen, setIsNotebookDialogOpen] = useState(false);
  const [notebookDialogMode, setNotebookDialogMode] = useState<'create' | 'edit'>('create');
  const [editingNotebook, setEditingNotebook] = useState<Collection | null>(null);
  const [notebookPages, setNotebookPages] = useState<typeof notes>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<typeof notes | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // New feature states
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);

  const {
    notes,
    selectedNote,
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

  const { tags: allTags, tagCounts } = useTags(notes);

  // Load notebook pages when a notebook is selected
  useEffect(() => {
    const loadPages = async () => {
      if (selectedNotebook) {
        try {
          const pages = await getCollectionNotes(selectedNotebook.id);
          setNotebookPages(pages);

          // If notebook has no pages, create the first page
          if (pages.length === 0) {
            const newPage = await createNote({
              title: 'Page 1',
              content: '',
              contentType: 'markdown',
              tags: [],
            });
            setNotebookPages([newPage]);
          }
        } catch (error) {
          console.error('Failed to load notebook pages:', error);
        }
      }
    };
    loadPages();
  }, [selectedNotebook?.id, getCollectionNotes, createNote]);

  const handleCreateNotebook = () => {
    setNotebookDialogMode('create');
    setEditingNotebook(null);
    setIsNotebookDialogOpen(true);
  };

  const handleSelectNotebook = (notebook: Collection) => {
    setSelectedNotebook(notebook);
  };

  const handleCloseNotebook = () => {
    setSelectedNotebook(null);
    setNotebookPages([]);
  };

  const handleEditNotebook = (notebook: Collection) => {
    setNotebookDialogMode('edit');
    setEditingNotebook(notebook);
    setIsNotebookDialogOpen(true);
  };

  const handleNotebookDialogSubmit = async (data: CreateCollectionInput | UpdateCollectionInput) => {
    if (notebookDialogMode === 'create') {
      const newNotebook = await createCollection(data as CreateCollectionInput);
      // When creating a new notebook, open it immediately
      if (newNotebook) {
        setSelectedNotebook(newNotebook);
      }
    } else if (editingNotebook) {
      await updateCollection(editingNotebook.id, data as UpdateCollectionInput);
    }
  };

  const handleDeleteNotebook = async (notebookId: string) => {
    try {
      await deleteCollection(notebookId);
      if (selectedNotebook?.id === notebookId) {
        handleCloseNotebook();
      }
    } catch (error) {
      console.error('Failed to delete notebook:', error);
    }
  };

  const handleCreatePage = async () => {
    if (!selectedNotebook) return;

    try {
      const newPage = await createNote({
        title: `Page ${notebookPages.length + 1}`,
        content: '',
        contentType: 'markdown',
        tags: [],
      });
      setNotebookPages(prev => [...prev, newPage]);
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  };

  const handleUpdatePage = async (pageId: string, updates: Parameters<typeof updateNote>[1]) => {
    await updateNote(pageId, updates);
    // Update local state
    setNotebookPages(prev =>
      prev.map(page => page.id === pageId ? { ...page, ...updates } : page)
    );
  };

  const handleDeletePage = async (pageId: string) => {
    await deleteNote(pageId);
    setNotebookPages(prev => prev.filter(page => page.id !== pageId));
  };

  // Tag handlers
  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleClearTagFilter = () => {
    setSelectedTag(null);
  };

  // Search handlers
  const handleSearchResults = (results: typeof notes) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults(null);
    setIsSearching(false);
  };

  const handleSelectNote = (note: typeof notes[number]) => {
    selectNote(note);
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(noteId);
  };

  // New feature handlers
  const handleDuplicateNote = async (note: Note) => {
    try {
      const duplicated = await notesApi.duplicateNote(note.id);
      if (selectedNotebook) {
        setNotebookPages(prev => [...prev, duplicated.note]);
      }
    } catch (error) {
      console.error('Failed to duplicate note:', error);
    }
  };

  const handleArchiveNote = async (noteId: string) => {
    try {
      await notesApi.archiveNote(noteId);
      if (selectedNotebook) {
        setNotebookPages(prev => prev.filter(page => page.id !== noteId));
      }
    } catch (error) {
      console.error('Failed to archive note:', error);
    }
  };

  const handleExportNote = async (note: Note, format: 'pdf' | 'markdown' | 'json') => {
    try {
      if (format === 'pdf') {
        await exportNoteToPDF(note);
      } else if (format === 'markdown') {
        const markdown = exportNoteToMarkdown(note);
        downloadMarkdown(markdown, note.title || 'Untitled');
      }
    } catch (error) {
      console.error('Failed to export note:', error);
    }
  };

  const handleCreateNoteFromTemplate = async (template: any) => {
    try {
      const content = processTemplateContent(template.content);
      const newNote = await createNote({
        title: template.name === 'Blank Note' ? 'Untitled' : template.name,
        content,
        contentType: 'markdown',
        tags: [],
      });

      if (selectedNotebook) {
        setNotebookPages(prev => [...prev, newNote]);
      }
      selectNote(newNote);
    } catch (error) {
      console.error('Failed to create note from template:', error);
    }
  };

  // Keyboard shortcuts
  const { shortcuts } = useKeyboardShortcuts({
    onNewNote: () => {
      setIsTemplatePickerOpen(true);
    },
    onNewCollection: handleCreateNotebook,
    onCommandPalette: () => setIsCommandPaletteOpen(true),
    onDuplicate: selectedNote ? () => handleDuplicateNote(selectedNote) : undefined,
    onArchive: selectedNote ? () => handleArchiveNote(selectedNote.id) : undefined,
    onExport: selectedNote ? () => handleExportNote(selectedNote, 'pdf') : undefined,
    onDelete: selectedNote ? () => handleDeleteNote(selectedNote.id) : undefined,
  });

  // Handle "?" key to toggle shortcuts dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        // Only trigger if not in an input field
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsShortcutsDialogOpen(prev => !prev);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);;

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

  // Determine which notes/pages to display
  let displayedNotes = selectedNotebook ? notebookPages : notes;

  // Apply search results if searching
  if (isSearching && searchResults) {
    displayedNotes = searchResults;
  }
  // Apply tag filter if selected (only when not searching)
  else if (selectedTag) {
    displayedNotes = displayedNotes.filter(note => note.tags && note.tags.includes(selectedTag));
  }

  return (
    <>
      <NotesLayout
        fullWidth={!!selectedNotebook} // Use full width when showing NotebookViewer
        sidebar={
          <NotesSidebar
            notes={displayedNotes}
            selectedNote={selectedNote}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreatePage}
            onDeleteNote={handleDeleteNote}
            collections={collections}
            currentCollection={selectedNotebook}
            onSelectCollection={handleSelectNotebook}
            onCreateCollection={handleCreateNotebook}
            onEditCollection={handleEditNotebook}
            onDeleteCollection={handleDeleteNotebook}
            onClearCollectionFilter={handleCloseNotebook}
            allTags={allTags}
            tagCounts={tagCounts}
            selectedTag={selectedTag}
            onSelectTag={handleSelectTag}
            onClearTagFilter={handleClearTagFilter}
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
            isSearching={isSearching}
            isDashboardView={!selectedNotebook}
            onDashboardClick={handleCloseNotebook}
          />
        }
      >
        {selectedNotebook ? (
          <NotebookViewer
            notebook={selectedNotebook}
            pages={notebookPages}
            onUpdatePage={handleUpdatePage}
            onCreatePage={handleCreatePage}
            onDeletePage={handleDeletePage}
            onClose={handleCloseNotebook}
            onEditNotebook={handleEditNotebook}
          />
        ) : (
          <Dashboard
            collections={collections}
            onSelectCollection={handleSelectNotebook}
            onCreateNotebook={handleCreateNotebook}
          />
        )}
      </NotesLayout>

      {/* Notebook Dialog */}
      <CollectionDialog
        isOpen={isNotebookDialogOpen}
        onClose={() => setIsNotebookDialogOpen(false)}
        onSubmit={handleNotebookDialogSubmit}
        onDelete={handleDeleteNotebook}
        collection={editingNotebook}
        mode={notebookDialogMode}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        isOpen={isShortcutsDialogOpen}
        onClose={() => setIsShortcutsDialogOpen(false)}
        shortcuts={shortcuts}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        collections={collections}
        onCreateNote={() => setIsTemplatePickerOpen(true)}
        onCreateCollection={handleCreateNotebook}
        onNavigateToNote={(noteId) => {
          const note = notes.find(n => n.id === noteId);
          if (note) selectNote(note);
        }}
        onNavigateToCollection={(collectionId) => {
          const collection = collections.find(c => c.id === collectionId);
          if (collection) setSelectedNotebook(collection);
        }}
        currentActions={selectedNote ? [
          {
            id: 'duplicate',
            label: 'Duplicate current note',
            icon: Copy,
            category: 'action',
            action: () => handleDuplicateNote(selectedNote),
          },
          {
            id: 'archive',
            label: 'Archive current note',
            icon: Archive,
            category: 'action',
            action: () => handleArchiveNote(selectedNote.id),
          },
          {
            id: 'export-pdf',
            label: 'Export to PDF',
            icon: Download,
            category: 'action',
            action: () => handleExportNote(selectedNote, 'pdf'),
          },
          {
            id: 'export-markdown',
            label: 'Export to Markdown',
            icon: Download,
            category: 'action',
            action: () => handleExportNote(selectedNote, 'markdown'),
          },
        ] : []}
      />

      {/* Template Picker */}
      <TemplatePickerDialog
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        onSelect={handleCreateNoteFromTemplate}
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
