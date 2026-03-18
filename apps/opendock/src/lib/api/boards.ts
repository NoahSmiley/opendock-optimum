import { request } from "./base";
import type {
  Board,
  BoardSnapshot,
  Column,
  Ticket,
  Label,
  Sprint,
  Comment,
} from "@/stores/boards/types";

export async function fetchBoards(): Promise<{ boards: Board[] }> {
  return request<{ boards: Board[] }>("/api/kanban/boards");
}

export async function fetchBoard(boardId: string): Promise<BoardSnapshot> {
  return request<BoardSnapshot>(`/api/kanban/boards/${boardId}`);
}

export async function createBoard(
  name: string,
  description?: string,
): Promise<BoardSnapshot> {
  return request<BoardSnapshot>("/api/kanban/boards", {
    method: "POST",
    body: { name, description },
  });
}

export async function updateBoard(
  boardId: string,
  data: { name?: string; description?: string | null },
): Promise<{ board: Board }> {
  return request(`/api/kanban/boards/${boardId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteBoard(boardId: string): Promise<void> {
  return request(`/api/kanban/boards/${boardId}`, { method: "DELETE" });
}

export async function createColumn(
  boardId: string,
  title: string,
): Promise<{ column: Column }> {
  return request(`/api/kanban/boards/${boardId}/columns`, {
    method: "POST",
    body: { title },
  });
}

export async function updateColumn(
  boardId: string,
  columnId: string,
  data: { title?: string; wipLimit?: number | null },
): Promise<{ column: Column }> {
  return request(`/api/kanban/boards/${boardId}/columns/${columnId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteColumn(
  boardId: string,
  columnId: string,
): Promise<void> {
  return request(`/api/kanban/boards/${boardId}/columns/${columnId}`, {
    method: "DELETE",
  });
}

export async function createTicket(
  boardId: string,
  data: { columnId: string; title: string; [key: string]: unknown },
): Promise<{ ticket: Ticket }> {
  return request(`/api/kanban/boards/${boardId}/tickets`, {
    method: "POST",
    body: data,
  });
}

export async function updateTicket(
  ticketId: string,
  data: Partial<Pick<Ticket, "title" | "description" | "priority" | "assigneeIds" | "labelIds" | "dueDate" | "sprintId" | "columnId">> & { storyPoints?: number | null },
): Promise<{ ticket: Ticket }> {
  return request(`/api/kanban/tickets/${ticketId}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteTicket(ticketId: string): Promise<void> {
  return request(`/api/kanban/tickets/${ticketId}`, { method: "DELETE" });
}

export async function reorderTicket(
  boardId: string,
  ticketId: string,
  toColumnId: string,
  toIndex: number,
): Promise<BoardSnapshot> {
  return request(`/api/kanban/boards/${boardId}/tickets/reorder`, {
    method: "PATCH",
    body: { ticketId, toColumnId, toIndex },
  });
}

export async function addComment(
  ticketId: string,
  content: string,
): Promise<{ comment: Comment }> {
  return request(`/api/kanban/tickets/${ticketId}/comments`, {
    method: "POST",
    body: { content },
  });
}

export async function deleteComment(commentId: string): Promise<void> {
  return request(`/api/kanban/comments/${commentId}`, { method: "DELETE" });
}

export async function createLabel(
  boardId: string,
  name: string,
  color: string,
): Promise<{ label: Label }> {
  return request(`/api/kanban/boards/${boardId}/labels`, {
    method: "POST",
    body: { name, color },
  });
}

export async function createSprint(
  boardId: string,
  data: { name: string; goal?: string; startDate: string; endDate: string },
): Promise<{ sprint: Sprint }> {
  return request(`/api/kanban/boards/${boardId}/sprints`, {
    method: "POST",
    body: data,
  });
}
