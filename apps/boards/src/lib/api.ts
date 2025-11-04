import type {
  KanbanBoardsResponse,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanSprint,
  KanbanTicket,
  KanbanTimeLog,
  KanbanActivity,
  KanbanLabel,
  KanbanAttachment,
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
    issueType?: "bug" | "task" | "story" | "epic";
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
  deleteTicket: async (ticketId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/kanban/tickets/${ticketId}`,
      method: "DELETE",
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
  updateColumn: async (boardId: string, columnId: string, updates: { title?: string; wipLimit?: number | null }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ column: any }>({
      path: `/api/kanban/boards/${boardId}/columns/${columnId}`,
      method: "PATCH",
      body: JSON.stringify(updates),
      headers,
    });
  },
  deleteColumn: async (boardId: string, columnId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/kanban/boards/${boardId}/columns/${columnId}`,
      method: "DELETE",
      headers,
    });
  },
  // Time tracking
  startTimer: async (ticketId: string, payload?: { startedAt?: string; description?: string }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ timeLog: KanbanTimeLog }>({
      path: `/api/kanban/tickets/${ticketId}/time-logs/start`,
      method: "POST",
      body: JSON.stringify(payload || {}),
      headers,
    });
  },
  stopTimer: async (ticketId: string, logId: string, payload?: { endedAt?: string }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ timeLog: KanbanTimeLog }>({
      path: `/api/kanban/tickets/${ticketId}/time-logs/${logId}/stop`,
      method: "POST",
      body: JSON.stringify(payload || {}),
      headers,
    });
  },
  getActiveTimer: (ticketId: string) =>
    request<{ timeLog: KanbanTimeLog | null }>({ path: `/api/kanban/tickets/${ticketId}/time-logs/active` }),
  listTimeLogs: (ticketId: string) =>
    request<{ timeLogs: KanbanTimeLog[] }>({ path: `/api/kanban/tickets/${ticketId}/time-logs` }),
  deleteTimeLog: async (logId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/kanban/time-logs/${logId}`,
      method: "DELETE",
      headers,
    });
  },

  // Activity methods
  listActivities: async (boardId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : "";
    return request<{ activities: KanbanActivity[] }>({
      path: `/api/kanban/boards/${boardId}/activity${params}`,
    });
  },

  listTicketActivities: async (ticketId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : "";
    return request<{ activities: KanbanActivity[] }>({
      path: `/api/kanban/tickets/${ticketId}/activity${params}`,
    });
  },

  listLabels: async (boardId: string) => {
    return request<{ labels: KanbanLabel[] }>({
      path: `/api/kanban/boards/${boardId}/labels`,
    });
  },

  createLabel: async (boardId: string, input: { name: string; color: string }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ label: KanbanLabel }>({
      path: `/api/kanban/boards/${boardId}/labels`,
      method: "POST",
      body: JSON.stringify(input),
      headers,
    });
  },

  updateLabel: async (labelId: string, input: { name?: string; color?: string }) => {
    const headers = await resolveCsrfHeaders();
    return request<{ label: KanbanLabel }>({
      path: `/api/kanban/labels/${labelId}`,
      method: "PATCH",
      body: JSON.stringify(input),
      headers,
    });
  },

  deleteLabel: async (labelId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/kanban/labels/${labelId}`,
      method: "DELETE",
      headers,
    });
  },

  uploadAttachments: async (ticketId: string, formData: FormData) => {
    const API_BASE = getApiBaseUrl();
    const response = await fetch(`${API_BASE}/api/kanban/tickets/${ticketId}/attachments`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    return response.json() as Promise<{ attachments: KanbanAttachment[] }>;
  },

  listAttachments: (ticketId: string) =>
    request<{ attachments: KanbanAttachment[] }>({
      path: `/api/kanban/tickets/${ticketId}/attachments`,
    }),

  deleteAttachment: async (attachmentId: string) => {
    const headers = await resolveCsrfHeaders();
    return request<{ success: boolean }>({
      path: `/api/kanban/attachments/${attachmentId}`,
      method: "DELETE",
      headers,
    });
  },
};

export const projectsApi = {
  listProjects: () => request<ProjectsResponse>({ path: "/api/projects" }),
};
