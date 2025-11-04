import type { Note, Folder, Collection, CreateNoteInput, UpdateNoteInput, CreateFolderInput, UpdateFolderInput, CreateCollectionInput, UpdateCollectionInput } from "@opendock/shared/types";

export interface NotesRepository {
  // Notes
  listNotes(params?: { userId?: string; folderId?: string; collectionId?: string; tags?: string[]; isPinned?: boolean; isArchived?: boolean }): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | null>;
  createNote(input: CreateNoteInput & { userId: string }): Promise<Note>;
  updateNote(id: string, input: UpdateNoteInput): Promise<Note | null>;
  deleteNote(id: string): Promise<boolean>;

  // Folders
  listFolders(params?: { userId?: string; parentId?: string | null }): Promise<Folder[]>;
  getFolderById(id: string): Promise<Folder | null>;
  createFolder(input: CreateFolderInput & { userId: string }): Promise<Folder>;
  updateFolder(id: string, input: UpdateFolderInput): Promise<Folder | null>;
  deleteFolder(id: string): Promise<boolean>;

  // Collections
  listCollections(params?: { userId?: string }): Promise<Collection[]>;
  getCollectionById(id: string): Promise<Collection | null>;
  createCollection(input: CreateCollectionInput & { userId: string }): Promise<Collection>;
  updateCollection(id: string, input: UpdateCollectionInput): Promise<Collection | null>;
  deleteCollection(id: string): Promise<boolean>;
  addNoteToCollection(collectionId: string, noteId: string): Promise<boolean>;
  removeNoteFromCollection(collectionId: string, noteId: string): Promise<boolean>;
  getCollectionsForNote(noteId: string): Promise<Collection[]>;

  // Tags
  getAllTags(userId?: string): Promise<string[]>;
}
