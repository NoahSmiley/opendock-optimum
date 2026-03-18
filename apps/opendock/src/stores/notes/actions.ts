import { useNotesStore } from "./store";
import * as notesApi from "@/lib/api/notes";
import type { NotesState, CreateNoteInput, UpdateNoteInput, CreateCollectionInput, UpdateCollectionInput } from "./types";

function setState(partial: Partial<NotesState> | ((s: NotesState) => Partial<NotesState>)) {
  useNotesStore.setState(partial as Parameters<typeof useNotesStore.setState>[0]);
}

export async function createNote(input: CreateNoteInput) {
  const note = await notesApi.createNote(input);
  setState((s) => ({ notes: [note, ...s.notes] }));
  return note;
}

export async function updateNote(noteId: string, input: UpdateNoteInput) {
  const updated = await notesApi.updateNote(noteId, input);
  setState((s) => ({
    notes: s.notes.map((n) => (n.id === noteId ? updated : n)),
    selectedNote: s.selectedNote?.id === noteId ? updated : s.selectedNote,
  }));
  return updated;
}

export async function deleteNote(noteId: string) {
  await notesApi.deleteNote(noteId);
  setState((s) => ({
    notes: s.notes.filter((n) => n.id !== noteId),
    selectedNote: s.selectedNote?.id === noteId ? null : s.selectedNote,
  }));
}

export async function duplicateNote(noteId: string) {
  const note = await notesApi.duplicateNote(noteId);
  setState((s) => ({ notes: [note, ...s.notes] }));
  return note;
}

export async function createCollection(input: CreateCollectionInput) {
  const collection = await notesApi.createCollection(input);
  setState((s) => ({ collections: [...s.collections, collection] }));
  return collection;
}

export async function updateCollection(collectionId: string, input: UpdateCollectionInput) {
  const updated = await notesApi.updateCollection(collectionId, input);
  setState((s) => ({
    collections: s.collections.map((c) => (c.id === collectionId ? updated : c)),
    activeCollection: s.activeCollection?.id === collectionId ? updated : s.activeCollection,
  }));
  return updated;
}

export async function deleteCollection(collectionId: string) {
  await notesApi.deleteCollection(collectionId);
  setState((s) => ({
    collections: s.collections.filter((c) => c.id !== collectionId),
    activeCollection: s.activeCollection?.id === collectionId ? null : s.activeCollection,
  }));
}

export async function fetchCollectionNotes(collectionId: string) {
  return notesApi.fetchCollectionNotes(collectionId);
}

export async function addNoteToCollection(collectionId: string, noteId: string) {
  await notesApi.addNoteToCollection(collectionId, noteId);
}

export async function removeNoteFromCollection(collectionId: string, noteId: string) {
  await notesApi.removeNoteFromCollection(collectionId, noteId);
}

export async function togglePin(noteId: string, isPinned: boolean) {
  return updateNote(noteId, { isPinned: !isPinned });
}

export async function archiveNote(noteId: string) {
  return updateNote(noteId, { isArchived: true });
}
