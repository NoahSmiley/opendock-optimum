import type {
  KanbanBoardsResponse,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanSprint,
  KanbanTicket,
  ProjectsResponse,
} from "@opendock/shared/types";
import { request, getApiBaseUrl } from "@opendock/shared/api";
import { resolveCsrfHeaders } from "./auth-client";

export const boardsApi = {
  listBoards: () => request<KanbanBoardsResponse>({ path: "/api/kanban/boards" }),
  boardSnapshot: (boardId: string) =>
    request<KanbanBoardSnapshot>({ path: `/api/kanban/boards/${boardId}` }),
  createBoard: async (payload: { name: string; description?: string; projectId?: string | null; members?: { name: string; email?: string }[] }) => {
    const headers = await resolveCsrfHeaders();
    return request<KanbanBoardSnapshot>({
      path: "/api/kanban/boards",
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });
  },
  updateBoard: async (boardId: string, payload: { name?: string; description?: string | null; projectId?: string | null }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ board: KanbanBoardSnapshot['board'] }>({
      path: `/api/kanban/boards/${boardId}`,
      method: "PATCH",
      body: JSON.stringify(payload),
      headers,
    });
  },
  createColumn: async (boardId: string, title: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ column: KanbanColumn }>({
      path: `/api/kanban/boards/${boardId}/columns`,
      method: "POST",
      body: JSON.stringify({ title }),
      headers,
    });
  },
  createTicket: async (boardId: string, payload: {
    columnId: string;
    title: string;
    description?: string;
    assigneeIds?: string[];
    tags?: string[];
    estimate?: number;
    priority?: "low" | "medium" | "high";
    sprintId?: string;
  }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ ticket: KanbanTicket }>({
      path: `/api/kanban/boards/${boardId}/tickets`,
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });
  },
  updateTicket: async (ticketId: string, payload: Partial<KanbanTicket>) => {
    const headers = await resolveCsrfHeaders();
    return request<{ ticket: KanbanTicket }>({
      path: `/api/kanban/tickets/${ticketId}`,
      method: "PATCH",
      body: JSON.stringify(payload),
      headers,
    });
  },
  reorderTicket: async (boardId: string, payload: { ticketId: string; toColumnId: string; toIndex: number }) => {
    const headers = await resolveCsrfHeaders();
    return request<KanbanBoardSnapshot>({
      path: `/api/kanban/boards/${boardId}/tickets/reorder`,
      method: "PATCH",
      body: JSON.stringify(payload),
      headers,
    });
  },
  createSprint: async (boardId: string, payload: { name: string; goal?: string; startDate: string; endDate: string; status?: "planned" | "active" | "completed" }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ sprint: KanbanSprint }>({
      path: `/api/kanban/boards/${boardId}/sprints`,
      method: "POST",
      body: JSON.stringify(payload),
      headers,
    });
  },
  streamBoard: (boardId: string): EventSource => {
    if (typeof window === "undefined" || typeof window.EventSource === "undefined") {
      throw new Error("EventSource is not available in this environment");
    }
    const url = `${getApiBaseUrl()}/api/kanban/boards/${boardId}/stream`;
    return new window.EventSource(url, { withCredentials: true });
  },
  addComment: async (ticketId: string, content: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ comment: any }>({
      path: `/api/kanban/tickets/${ticketId}/comments`,
      method: "POST",
      body: JSON.stringify({ content }),
      headers,
    });
  },
  deleteComment: async (commentId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/kanban/comments/${commentId}`,
      method: "DELETE",
      headers,
    });
  },
};

export const projectsApi = {
  listProjects: () => request<ProjectsResponse>({ path: "/api/projects" }),
};
