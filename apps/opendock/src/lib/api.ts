import type {
  ProjectsResponse,
  Build,
  Project,
  KanbanBoardSnapshot,
  KanbanBoardsResponse,
  KanbanColumn,
  KanbanSprint,
  KanbanTicket,
} from "@opendock/shared/types";
import { request } from "@opendock/shared/api";

export async function fetchProjects() {
  return request<ProjectsResponse>({ path: "/api/projects" });
}

export async function createProject(input: {
  name: string;
  repoUrl: string;
  branch?: string;
  installCommand?: string;
  buildCommand?: string;
}) {
  return request<{ project: Project; initialBuildId: string }>({
    path: "/api/projects",
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function triggerRedeploy(projectId: string, branch?: string) {
  return request<{ build: Build }>({
    path: `/api/projects/${projectId}/redeploy`,
    method: "POST",
    body: JSON.stringify({ branch }),
  });
}

export async function fetchProjectLogs(projectId: string) {
  return request<{ builds: Build[] }>({ path: `/api/projects/${projectId}/logs` });
}

export async function updateProject(projectId: string, payload: { branch?: string; installCommand?: string | null; buildCommand?: string | null }) {
  return request<{ project: Project }>({
    path: `/api/projects/${projectId}`,
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function fetchBoards(): Promise<KanbanBoardsResponse> {
  return request<KanbanBoardsResponse>({ path: "/api/kanban/boards" });
}

export async function createBoard(payload: { name: string; description?: string; members?: { name: string; email?: string }[] }) {
  return request<KanbanBoardSnapshot>({
    path: "/api/kanban/boards",
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createColumn(boardId: string, title: string) {
  return request<{ column: KanbanColumn }>({
    path: `/api/kanban/boards/${boardId}/columns`,
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function createTicket(boardId: string, payload: {
  columnId: string;
  title: string;
  description?: string;
  assigneeIds?: string[];
  tags?: string[];
  estimate?: number;
  priority?: "low" | "medium" | "high";
  sprintId?: string;
}) {
  return request<{ ticket: KanbanTicket }>({
    path: `/api/kanban/boards/${boardId}/tickets`,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reorderTicket(boardId: string, payload: { ticketId: string; toColumnId: string; toIndex: number }) {
  return request<KanbanBoardSnapshot>({
    path: `/api/kanban/boards/${boardId}/tickets/reorder`,
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createSprint(boardId: string, payload: { name: string; goal?: string; startDate: string; endDate: string; status?: "planned" | "active" | "completed" }) {
  return request<{ sprint: KanbanSprint }>({
    path: `/api/kanban/boards/${boardId}/sprints`,
    method: "POST",
    body: JSON.stringify(payload),
  });
}
