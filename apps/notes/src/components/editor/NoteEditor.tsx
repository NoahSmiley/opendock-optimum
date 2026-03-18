import { useState, useEffect } from 'react';
import { Pin, Trash2, Save, Clock } from 'lucide-react';
import clsx from 'clsx';
import type { Note, UpdateNoteInput, Collection } from '@opendock/shared/types';
import { useAutoSave, useTags } from '../../hooks';
import { notesApi, collectionsApi } from '../../lib/api';
import { CollectionPicker } from './CollectionPicker';
import { TagManager } from '../tags';
import { BoardLinker } from '../boards';
import { RichTextEditor } from './RichTextEditor';

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
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [noteCollections, setNoteCollections] = useState<Collection[]>([]);
  const [linkedBoards, setLinkedBoards] = useState<any[]>([]);

  const { tags: allTags } = useTags();

  // Reset state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsPinned(note.isPinned);
    setTags(note.tags || []);
  }, [note.id, note.title, note.content, note.isPinned, note.tags]);

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

    const loadLinkedBoards = async () => {
      try {
        const response = await notesApi.getLinkedBoards(note.id);
        setLinkedBoards(response.boards || []);
      } catch (error) {
        console.error('Failed to load linked boards:', error);
      }
    };

    loadNoteCollections();
    loadLinkedBoards();
  }, [note.id]);

  // Auto-save functionality
  const { isSaving, lastSaved } = useAutoSave({
    data: { title, content, tags },
    onSave: async (data) => {
      if (data.title !== note.title || data.content !== note.content || JSON.stringify(data.tags) !== JSON.stringify(note.tags)) {
        await onUpdate(note.id, {
          title: data.title,
          content: data.content,
          tags: data.tags,
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

  const handleLinkBoard = async (boardId: string) => {
    await notesApi.linkToBoard({ noteId: note.id, boardId });
    // Refresh linked boards
    const response = await notesApi.getLinkedBoards(note.id);
    setLinkedBoards(response.boards || []);
  };

  const handleUnlinkBoard = async (boardId: string) => {
    await notesApi.unlinkFromBoard(note.id, boardId);
    // Refresh linked boards
    const response = await notesApi.getLinkedBoards(note.id);
    setLinkedBoards(response.boards || []);
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
    <div className="flex h-full flex-col">
      {/* Editor Header */}
      <div className="shrink-0 border-b border-neutral-200 bg-white px-8 py-4 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border-none bg-transparent text-3xl font-bold text-neutral-900 outline-none placeholder:text-neutral-300 focus:ring-0 dark:text-white dark:placeholder:text-neutral-700"
            placeholder="Untitled"
          />
          <div className="flex items-center gap-1">
            {/* Save Status */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
              {isSaving ? (
                <>
                  <Save className="h-3.5 w-3.5 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Saved {formatLastSaved()}</span>
                </>
              ) : null}
            </div>

            {/* Actions */}
            <button
              onClick={handleTogglePin}
              className={clsx(
                'rounded-lg p-2 transition-colors',
                isPinned
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300'
              )}
              title={isPinned ? 'Unpin note' : 'Pin note'}
            >
              <Pin className={clsx('h-4 w-4', isPinned && 'fill-current')} />
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Panel - Collapsible section */}
      {!currentCollection && (
        <details className="group border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <summary className="flex cursor-pointer items-center justify-between px-8 py-2.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-400">
            <span>Details</span>
            <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="space-y-5 border-t border-neutral-100 px-8 py-4 dark:border-neutral-800/50">
            <div>
              <label className="mb-2 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Collections
              </label>
              <CollectionPicker
                noteId={note.id}
                noteCollections={noteCollections}
                allCollections={allCollections}
                onAdd={handleAddToCollection}
                onRemove={handleRemoveFromCollection}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Tags
              </label>
              <TagManager
                tags={tags}
                allTags={allTags}
                onChange={setTags}
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Linked Boards
              </label>
              <BoardLinker
                noteId={note.id}
                linkedBoards={linkedBoards}
                onLink={handleLinkBoard}
                onUnlink={handleUnlinkBoard}
              />
            </div>
          </div>
        </details>
      )}

      {/* Rich Text Editor */}
      <div className="flex-1 overflow-hidden">
        <RichTextEditor
          initialContent={note.content}
          onChange={setContent}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
