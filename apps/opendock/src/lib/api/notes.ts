import { request } from "./base";
import type {
  Note,
  Collection,
  Folder,
  CreateNoteInput,
  UpdateNoteInput,
  CreateCollectionInput,
  UpdateCollectionInput,
} from "@/stores/notes/types";

// --- Notes ---

export async function fetchNotes(params?: { folderId?: string; tags?: string[]; isPinned?: boolean }): Promise<Note[]> {
  const query = new URLSearchParams();
  if (params?.folderId) query.set("folderId", params.folderId);
  if (params?.isPinned) query.set("isPinned", "true");
  if (params?.tags?.length) query.set("tags", params.tags.join(","));
  const qs = query.toString();
  const res = await request<{ notes: Note[] }>(`/api/notes${qs ? `?${qs}` : ""}`);
  return res.notes;
}

export async function fetchNote(noteId: string): Promise<Note> {
  const res = await request<{ note: Note }>(`/api/notes/${noteId}`);
  return res.note;
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const res = await request<{ note: Note }>("/api/notes", { method: "POST", body: input });
  return res.note;
}

export async function updateNote(noteId: string, input: UpdateNoteInput): Promise<Note> {
  const res = await request<{ note: Note }>(`/api/notes/${noteId}`, { method: "PATCH", body: input });
  return res.note;
}

export async function deleteNote(noteId: string): Promise<void> {
  return request<void>(`/api/notes/${noteId}`, { method: "DELETE" });
}

export async function duplicateNote(noteId: string): Promise<Note> {
  const res = await request<{ note: Note }>(`/api/notes/${noteId}/duplicate`, { method: "POST" });
  return res.note;
}

export async function searchNotes(query: string): Promise<Note[]> {
  const res = await request<{ notes: Note[] }>(`/api/notes/search?q=${encodeURIComponent(query)}`);
  return res.notes;
}

// --- Folders ---

export async function fetchFolders(): Promise<Folder[]> {
  const res = await request<{ folders: Folder[] }>("/api/notes/folders");
  return res.folders;
}

export async function createFolder(name: string, parentId?: string): Promise<Folder> {
  const res = await request<{ folder: Folder }>("/api/notes/folders", { method: "POST", body: { name, parentId } });
  return res.folder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  return request<void>(`/api/notes/folders/${folderId}`, { method: "DELETE" });
}

// --- Collections ---

export async function fetchCollections(): Promise<Collection[]> {
  const res = await request<{ collections: Collection[] }>("/api/notes/collections");
  return res.collections;
}

export async function fetchCollection(collectionId: string): Promise<Collection> {
  const res = await request<{ collection: Collection }>(`/api/notes/collections/${collectionId}`);
  return res.collection;
}

export async function createCollection(input: CreateCollectionInput): Promise<Collection> {
  const res = await request<{ collection: Collection }>("/api/notes/collections", { method: "POST", body: input });
  return res.collection;
}

export async function updateCollection(collectionId: string, input: UpdateCollectionInput): Promise<Collection> {
  const res = await request<{ collection: Collection }>(`/api/notes/collections/${collectionId}`, { method: "PATCH", body: input });
  return res.collection;
}

export async function deleteCollection(collectionId: string): Promise<void> {
  return request<void>(`/api/notes/collections/${collectionId}`, { method: "DELETE" });
}

export async function fetchCollectionNotes(collectionId: string): Promise<Note[]> {
  const res = await request<{ notes: Note[] }>(`/api/notes/collections/${collectionId}/notes`);
  return res.notes;
}

export async function addNoteToCollection(collectionId: string, noteId: string): Promise<void> {
  return request<void>(`/api/notes/collections/${collectionId}/notes/${noteId}`, { method: "POST" });
}

export async function removeNoteFromCollection(collectionId: string, noteId: string): Promise<void> {
  return request<void>(`/api/notes/collections/${collectionId}/notes/${noteId}`, { method: "DELETE" });
}
