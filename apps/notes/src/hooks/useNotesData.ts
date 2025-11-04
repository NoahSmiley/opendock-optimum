import { useState, useEffect, useCallback } from 'react';
import type { Note, Folder, CreateNoteInput, UpdateNoteInput } from '@opendock/shared/types';
import { notesApi } from '../lib/api';

export interface UseNotesDataReturn {
  notes: Note[];
  folders: Folder[];
  selectedNote: Note | null;
  isLoading: boolean;
  error: string | null;

  // Note operations
  createNote: (input: CreateNoteInput) => Promise<Note>;
  updateNote: (noteId: string, input: UpdateNoteInput) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
  selectNote: (note: Note | null) => void;

  // Folder operations
  loadNotes: (folderId?: string) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

export function useNotesData(): UseNotesDataReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async (folderId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notesApi.listNotes(folderId ? { folderId } : undefined);
      setNotes(response.notes || []);
      setFolders(response.folders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
      console.error('Failed to load notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadNotes();
  }, [loadNotes]);

  const createNote = useCallback(async (input: CreateNoteInput): Promise<Note> => {
    setError(null);
    try {
      const response = await notesApi.createNote(input);
      const newNote = response.note;
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateNote = useCallback(async (noteId: string, input: UpdateNoteInput): Promise<Note> => {
    setError(null);
    try {
      const response = await notesApi.updateNote(noteId, input);
      const updatedNote = response.note;
      setNotes(prev =>
        prev.map(note => (note.id === noteId ? updatedNote : note))
      );
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote);
      }
      return updatedNote;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      setError(message);
      throw new Error(message);
    }
  }, [selectedNote]);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    setError(null);
    try {
      await notesApi.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      setError(message);
      throw new Error(message);
    }
  }, [selectedNote]);

  const selectNote = useCallback((note: Note | null) => {
    setSelectedNote(note);
  }, []);

  // Load initial data
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    folders,
    selectedNote,
    isLoading,
    error,
    createNote,
    updateNote,
    deleteNote,
    selectNote,
    loadNotes,
    refresh,
  };
}
