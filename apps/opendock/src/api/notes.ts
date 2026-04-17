import { apiDelete, apiGet, apiPatch, apiPost } from "@/api/client";
import type { Note } from "@/types";

export const fetchNotes = () => apiGet<Note[]>("/notes");
export const createNote = (body: Partial<Pick<Note, "title" | "content" | "pinned">>) =>
  apiPost<Note>("/notes", body);
export const updateNote = (id: string, patch: Partial<Pick<Note, "title" | "content" | "pinned">>) =>
  apiPatch<Note>(`/notes/${id}`, patch);
export const deleteNote = (id: string) => apiDelete(`/notes/${id}`);
