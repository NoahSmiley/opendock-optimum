import { apiDelete, apiGet, apiPatch, apiPost } from "@/api/client";
import type { Board, BoardDetail, Card, Column } from "@/types";

export const fetchBoards = () => apiGet<Board[]>("/boards");
export const fetchBoardDetail = (id: string) => apiGet<BoardDetail>(`/boards/${id}`);
export const createBoard = (name: string) => apiPost<Board>("/boards", { name });
export const updateBoard = (id: string, patch: Partial<Pick<Board, "name" | "pinned">>) =>
  apiPatch<Board>(`/boards/${id}`, patch);
export const deleteBoard = (id: string) => apiDelete(`/boards/${id}`);

export const createColumn = (boardId: string, title: string) =>
  apiPost<Column>(`/boards/${boardId}/columns`, { title });

export const createCard = (boardId: string, columnId: string, title: string) =>
  apiPost<Card>(`/boards/${boardId}/cards`, { column_id: columnId, title });
export const updateCard = (boardId: string, cardId: string, patch: CardPatch) =>
  apiPatch<Card>(`/boards/${boardId}/cards/${cardId}`, patch);
export const deleteCard = (boardId: string, cardId: string) =>
  apiDelete(`/boards/${boardId}/cards/${cardId}`);

export interface CardPatch {
  title?: string;
  description?: string;
  column_id?: string;
  position?: number;
  assignee_id?: string | null;
}

export const addBoardMember = (boardId: string, email: string) =>
  apiPost<null>(`/boards/${boardId}/members`, { email });
export const removeBoardMember = (boardId: string, userId: string) =>
  apiDelete(`/boards/${boardId}/members/${userId}`);
