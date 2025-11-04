import type { Note, Folder, Collection, CreateNoteInput, UpdateNoteInput, CreateFolderInput, UpdateFolderInput, CreateCollectionInput, UpdateCollectionInput } from "@opendock/shared/types";
import type { NotesRepository } from "./notes.types";
import { store } from "../state";
import { randomUUID } from "crypto";

export class StateNotesRepository implements NotesRepository {
  async listNotes(params?: {
    userId?: string;
    folderId?: string;
    tags?: string[];
    isPinned?: boolean;
    isArchived?: boolean;
  }): Promise<Note[]> {
    const state = store.snapshot();
    let notes = state.notes || [];

    if (params?.userId) {
      notes = notes.filter((n) => n.userId === params.userId);
    }
    if (params?.folderId !== undefined) {
      notes = notes.filter((n) => n.folderId === params.folderId);
    }
    if (params?.isPinned !== undefined) {
      notes = notes.filter((n) => n.isPinned === params.isPinned);
    }
    if (params?.isArchived !== undefined) {
      notes = notes.filter((n) => n.isArchived === params.isArchived);
    }
    if (params?.tags && params.tags.length > 0) {
      notes = notes.filter((n) =>
        params.tags!.some((tag) => n.tags.includes(tag))
      );
    }

    return notes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  async getNoteById(id: string): Promise<Note | null> {
    const state = store.snapshot();
    return state.notes?.find((n) => n.id === id) || null;
  }

  async createNote(input: CreateNoteInput & { userId: string }): Promise<Note> {
    const now = new Date().toISOString();
    const note: Note = {
      id: randomUUID(),
      title: input.title,
      content: input.content || "",
      contentType: input.contentType || "markdown",
      folderId: input.folderId || null,
      tags: input.tags || [],
      isPinned: input.isPinned || false,
      isArchived: false,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    };

    const state = store.snapshot();
    if (!state.notes) state.notes = [];
    state.notes.push(note);
    store.update(state);

    return note;
  }

  async updateNote(id: string, input: UpdateNoteInput): Promise<Note | null> {
    const state = store.snapshot();
    if (!state.notes) return null;

    const noteIndex = state.notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) return null;

    const now = new Date().toISOString();
    state.notes[noteIndex] = {
      ...state.notes[noteIndex],
      ...(input.title !== undefined && { title: input.title }),
      ...(input.content !== undefined && { content: input.content }),
      ...(input.folderId !== undefined && { folderId: input.folderId }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
      ...(input.isArchived !== undefined && { isArchived: input.isArchived }),
      updatedAt: now,
    };
    store.update(state);

    return state.notes[noteIndex];
  }

  async deleteNote(id: string): Promise<boolean> {
    const state = store.snapshot();
    if (!state.notes) return false;

    const noteIndex = state.notes.findIndex((n) => n.id === id);
    if (noteIndex === -1) return false;

    state.notes.splice(noteIndex, 1);
    store.update(state);

    return true;
  }

  async listFolders(params?: {
    userId?: string;
    parentId?: string | null;
  }): Promise<Folder[]> {
    const state = store.snapshot();
    let folders = state.folders || [];

    if (params?.userId) {
      folders = folders.filter((f) => f.userId === params.userId);
    }
    if (params?.parentId !== undefined) {
      folders = folders.filter((f) => f.parentId === params.parentId);
    }

    return folders.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getFolderById(id: string): Promise<Folder | null> {
    const state = store.snapshot();
    return state.folders?.find((f) => f.id === id) || null;
  }

  async createFolder(input: CreateFolderInput & { userId: string }): Promise<Folder> {
    const now = new Date().toISOString();
    const folder: Folder = {
      id: randomUUID(),
      name: input.name,
      color: input.color || null,
      icon: input.icon || null,
      parentId: input.parentId || null,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
    };

    const state = store.snapshot();
    if (!state.folders) state.folders = [];
    state.folders.push(folder);
    store.update(state);

    return folder;
  }

  async updateFolder(
    id: string,
    input: UpdateFolderInput
  ): Promise<Folder | null> {
    const state = store.snapshot();
    if (!state.folders) return null;

    const folderIndex = state.folders.findIndex((f) => f.id === id);
    if (folderIndex === -1) return null;

    const now = new Date().toISOString();
    state.folders[folderIndex] = {
      ...state.folders[folderIndex],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.parentId !== undefined && { parentId: input.parentId }),
      updatedAt: now,
    };
    store.update(state);

    return state.folders[folderIndex];
  }

  async deleteFolder(id: string): Promise<boolean> {
    const state = store.snapshot();
    if (!state.folders) return false;

    const folderIndex = state.folders.findIndex((f) => f.id === id);
    if (folderIndex === -1) return false;

    // Unlink notes in this folder
    if (state.notes) {
      state.notes = state.notes.map((note) =>
        note.folderId === id ? { ...note, folderId: null } : note
      );
    }

    state.folders.splice(folderIndex, 1);
    store.update(state);

    return true;
  }

  async getAllTags(userId?: string): Promise<string[]> {
    const state = store.snapshot();
    const notes = userId
      ? (state.notes || []).filter((n) => n.userId === userId)
      : state.notes || [];

    const tagsSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagsSet.add(tag));
    });

    return Array.from(tagsSet);
  }

  async listCollections(params?: { userId?: string }): Promise<Collection[]> {
    const state = store.snapshot();
    let collections = state.collections || [];

    if (params?.userId) {
      collections = collections.filter((c) => c.userId === params.userId);
    }

    // Add note counts
    const collectionNotes = state.collectionNotes || [];
    return collections.map((c) => ({
      ...c,
      noteCount: collectionNotes.filter((cn) => cn.collectionId === c.id).length,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCollectionById(id: string): Promise<Collection | null> {
    const state = store.snapshot();
    const collection = (state.collections || []).find((c) => c.id === id);
    if (!collection) return null;

    const collectionNotes = state.collectionNotes || [];
    return {
      ...collection,
      noteCount: collectionNotes.filter((cn) => cn.collectionId === id).length,
    };
  }

  async createCollection(input: CreateCollectionInput & { userId: string }): Promise<Collection> {
    const now = new Date().toISOString();
    const collection: Collection = {
      id: randomUUID(),
      name: input.name,
      description: input.description || null,
      color: input.color || null,
      icon: input.icon || null,
      userId: input.userId,
      createdAt: now,
      updatedAt: now,
      noteCount: 0,
    };

    const state = store.snapshot();
    if (!state.collections) state.collections = [];
    state.collections.push(collection);
    store.update(state);

    return collection;
  }

  async updateCollection(id: string, input: UpdateCollectionInput): Promise<Collection | null> {
    const state = store.snapshot();
    if (!state.collections) return null;

    const collectionIndex = state.collections.findIndex((c) => c.id === id);
    if (collectionIndex === -1) return null;

    const now = new Date().toISOString();
    state.collections[collectionIndex] = {
      ...state.collections[collectionIndex],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.icon !== undefined && { icon: input.icon }),
      updatedAt: now,
    };
    store.update(state);

    const collectionNotes = state.collectionNotes || [];
    return {
      ...state.collections[collectionIndex],
      noteCount: collectionNotes.filter((cn) => cn.collectionId === id).length,
    };
  }

  async deleteCollection(id: string): Promise<boolean> {
    const state = store.snapshot();
    if (!state.collections) return false;

    const collectionIndex = state.collections.findIndex((c) => c.id === id);
    if (collectionIndex === -1) return false;

    // Remove all collection-note links
    if (state.collectionNotes) {
      state.collectionNotes = state.collectionNotes.filter((cn) => cn.collectionId !== id);
    }

    state.collections.splice(collectionIndex, 1);
    store.update(state);

    return true;
  }

  async addNoteToCollection(collectionId: string, noteId: string): Promise<boolean> {
    const state = store.snapshot();
    if (!state.collectionNotes) state.collectionNotes = [];

    // Check if already exists
    const exists = state.collectionNotes.some(
      (cn) => cn.collectionId === collectionId && cn.noteId === noteId
    );
    if (exists) return true;

    state.collectionNotes.push({
      id: randomUUID(),
      collectionId,
      noteId,
      createdAt: new Date().toISOString(),
    });
    store.update(state);

    return true;
  }

  async removeNoteFromCollection(collectionId: string, noteId: string): Promise<boolean> {
    const state = store.snapshot();
    if (!state.collectionNotes) return false;

    const initialLength = state.collectionNotes.length;
    state.collectionNotes = state.collectionNotes.filter(
      (cn) => !(cn.collectionId === collectionId && cn.noteId === noteId)
    );

    if (state.collectionNotes.length === initialLength) return false;

    store.update(state);
    return true;
  }

  async getCollectionsForNote(noteId: string): Promise<Collection[]> {
    const state = store.snapshot();
    if (!state.collectionNotes || !state.collections) return [];

    const collectionIds = state.collectionNotes
      .filter((cn) => cn.noteId === noteId)
      .map((cn) => cn.collectionId);

    const collections = state.collections
      .filter((c) => collectionIds.includes(c.id))
      .map((c) => ({
        ...c,
        noteCount: state.collectionNotes?.filter((cn) => cn.collectionId === c.id).length || 0,
      }));

    return collections;
  }
}
