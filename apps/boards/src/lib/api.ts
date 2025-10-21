import type {
  KanbanBoardsResponse,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanSprint,
  KanbanTicket,
} from "@opendock/shared/types";
import { request } from "@opendock/shared/api";

export const boardsApi = {
  listBoards: () => request<KanbanBoardsResponse>({ path: "/api/kanban/boards" }),
  createBoard: (payload: { name: string; description?: string; members?: { name: string; email?: string }[] }) =>
    request<KanbanBoardSnapshot>({
      path: "/api/kanban/boards",
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createColumn: (boardId: string, title: string) =>
    request<{ column: KanbanColumn }>({
      path: `/api/kanban/boards/${boardId}/columns`,
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  createTicket: (boardId: string, payload: {
    columnId: string;
    title: string;
    description?: string;
    assigneeIds?: string[];
    tags?: string[];
    estimate?: number;
    priority?: "low" | "medium" | "high";
    sprintId?: string;
  }) =>
    request<{ ticket: KanbanTicket }>({
      path: `/api/kanban/boards/${boardId}/tickets`,
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTicket: (ticketId: string, payload: Partial<KanbanTicket>) =>
    request<{ ticket: KanbanTicket }>({
      path: `/api/kanban/tickets/${ticketId}`,
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  reorderTicket: (boardId: string, payload: { ticketId: string; toColumnId: string; toIndex: number }) =>
    request<KanbanBoardSnapshot>({
      path: `/api/kanban/boards/${boardId}/tickets/reorder`,
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createSprint: (boardId: string, payload: { name: string; goal?: string; startDate: string; endDate: string; status?: "planned" | "active" | "completed" }) =>
    request<{ sprint: KanbanSprint }>({
      path: `/api/kanban/boards/${boardId}/sprints`,
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
