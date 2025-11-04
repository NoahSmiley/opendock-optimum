import { useState, useEffect } from 'react';
import { Pin, Trash2, Save, Clock } from 'lucide-react';
import clsx from 'clsx';
import MDEditor from '@uiw/react-md-editor';
import type { Note, UpdateNoteInput, Collection } from '@opendock/shared/types';
import { useAutoSave } from '../../hooks';
import { notesApi, collectionsApi } from '../../lib/api';
import { CollectionPicker } from './CollectionPicker';

interface NoteEditorProps {
  note: Note;
  onUpdate: (noteId: string, updates: UpdateNoteInput) => Promise<Note>;
  onDelete: (noteId: string) => Promise<void>;
  allCollections: Collection[];
  currentCollection?: Collection | null;
}

export function NoteEditor({ note, onUpdate, onDelete, allCollections, currentCollection = null }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [noteCollections, setNoteCollections] = useState<Collection[]>([]);

  // Reset state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsPinned(note.isPinned);
  }, [note.id, note.title, note.content, note.isPinned]);

  // Load collections for this note
  useEffect(() => {
    const loadNoteCollections = async () => {
      try {
        const response = await notesApi.getNoteCollections(note.id);
        setNoteCollections(response.collections);
      } catch (error) {
        console.error('Failed to load note collections:', error);
      }
    };

    loadNoteCollections();
  }, [note.id]);

  // Auto-save functionality
  const { isSaving, lastSaved, saveNow } = useAutoSave({
    data: { title, content },
    onSave: async (data) => {
      if (data.title !== note.title || data.content !== note.content) {
        await onUpdate(note.id, {
          title: data.title,
          content: data.content,
        });
      }
    },
    delay: 2000,
    enabled: true,
  });

  const handleTogglePin = async () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    await onUpdate(note.id, { isPinned: newPinned });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      await onDelete(note.id);
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    await collectionsApi.addNote(collectionId, note.id);
    // Refresh the note collections
    const response = await notesApi.getNoteCollections(note.id);
    setNoteCollections(response.collections);
  };

  const handleRemoveFromCollection = async (collectionId: string) => {
    await collectionsApi.removeNote(collectionId, note.id);
    // Refresh the note collections
    const response = await notesApi.getNoteCollections(note.id);
    setNoteCollections(response.collections);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return lastSaved.toLocaleDateString();
  };

  return (
    <>
      {/* Editor Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-10 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 border-none bg-transparent text-2xl font-semibold text-neutral-900 outline-none focus:ring-0 dark:text-white"
          placeholder="Untitled"
        />
        <div className="flex items-center gap-2">
          {/* Save Status */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
            {isSaving ? (
              <>
                <Save className="h-3 w-3 animate-pulse" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Clock className="h-3 w-3" />
                <span>Saved {formatLastSaved()}</span>
              </>
            ) : null}
          </div>

          {/* Actions */}
          <button
            onClick={handleTogglePin}
            className={clsx(
              'rounded-md p-2 transition-colors',
              isPinned
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
            )}
            title={isPinned ? 'Unpin note' : 'Pin note'}
          >
            <Pin className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-600 dark:hover:bg-neutral-800 dark:hover:text-red-400"
            title="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collection Picker - Only show when not inside a collection */}
      {!currentCollection && (
        <div className="border-b border-neutral-200 bg-white px-10 py-3 dark:border-neutral-800 dark:bg-neutral-950">
          <CollectionPicker
            noteId={note.id}
            noteCollections={noteCollections}
            allCollections={allCollections}
            onAdd={handleAddToCollection}
            onRemove={handleRemoveFromCollection}
          />
        </div>
      )}

      {/* Markdown Editor */}
      <div className="flex-1 overflow-y-auto px-10 py-8" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={(val) => setContent(val || '')}
          preview="edit"
          hideToolbar={false}
          height="100%"
          visibleDragbar={false}
          className="!bg-transparent !border-none"
          textareaProps={{
            placeholder: 'Start writing...',
            className: 'bg-transparent text-neutral-900 dark:text-white',
          }}
        />
      </div>
    </>
  );
}
