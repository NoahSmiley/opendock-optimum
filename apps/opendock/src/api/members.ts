import { apiDelete, apiGet, apiPost } from "@/api/client";
import type { NoteMember } from "@/types";

export const fetchNoteMembers = (noteId: string) =>
  apiGet<NoteMember[]>(`/notes/${noteId}/members`);

export const addNoteMember = (noteId: string, email: string, role: "editor" | "viewer" = "editor") =>
  apiPost<null>(`/notes/${noteId}/members`, { email, role });

export const removeNoteMember = (noteId: string, userId: string) =>
  apiDelete(`/notes/${noteId}/members/${userId}`);

export const addBoardMember = (boardId: string, email: string) =>
  apiPost<null>(`/boards/${boardId}/members`, { email });
