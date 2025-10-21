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
import type { ProjectCreateInput, ProjectDetailResponse, ProjectUpdateInput } from "@opendock/shared/projects";
import { request } from "@opendock/shared/api";
import { fetchCsrfToken, getCsrfToken } from "./auth-client";

async function resolveCsrfHeaders(): Promise<Record<string, string>> {
  let token = getCsrfToken();
  if (!token) {
    token = await fetchCsrfToken();
  }
  if (!token) {
    throw new Error("CSRF token is unavailable. Please refresh and try again.");
  }
  return {
    "X-OPENDOCK-CSRF": token,
  };
}

export async function fetchProjects(): Promise<ProjectsResponse> {
  return request<ProjectsResponse>({ path: "/api/projects" });
}

export async function createProject(input: ProjectCreateInput) {
  const headers = await resolveCsrfHeaders();
  return request<{ project: Project; initialBuildId: string }>({
    path: "/api/projects",
    method: "POST",
    body: JSON.stringify(input),
    headers,
  });
}

export async function triggerRedeploy(projectId: string, branch?: string) {
  const headers = await resolveCsrfHeaders();
  return request<{ build: Build }>({
    path: `/api/projects/${projectId}/redeploy`,
    method: "POST",
    body: JSON.stringify({ branch }),
    headers,
  });
}

export async function fetchProjectLogs(projectId: string) {
  return request<{ builds: Build[] }>({ path: `/api/projects/${projectId}/logs` });
}

export async function fetchProject(projectId: string) {
  return request<ProjectDetailResponse>({ path: `/api/projects/${projectId}` });
}

export async function updateProject(projectId: string, payload: ProjectUpdateInput) {
  const headers = await resolveCsrfHeaders();
  return request<{ project: Project }>({
    path: `/api/projects/${projectId}`,
    method: "PATCH",
    body: JSON.stringify(payload),
    headers,
  });
}

export async function fetchBoards(): Promise<KanbanBoardsResponse> {
  return request<KanbanBoardsResponse>({ path: "/api/kanban/boards" });
}

export async function createBoard(payload: { name: string; description?: string; members?: { name: string; email?: string }[] }) {
  const headers = await resolveCsrfHeaders();
  return request<KanbanBoardSnapshot>({
    path: "/api/kanban/boards",
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });
}

export async function createColumn(boardId: string, title: string) {
  const headers = await resolveCsrfHeaders();
  return request<{ column: KanbanColumn }>({
    path: `/api/kanban/boards/${boardId}/columns`,
    method: "POST",
    body: JSON.stringify({ title }),
    headers,
  });
}

export async function createTicket(
  boardId: string,
  payload: {
    columnId: string;
    title: string;
    description?: string;
    assigneeIds?: string[];
    tags?: string[];
    estimate?: number;
    priority?: "low" | "medium" | "high";
    sprintId?: string;
  },
) {
  const headers = await resolveCsrfHeaders();
  return request<{ ticket: KanbanTicket }>({
    path: `/api/kanban/boards/${boardId}/tickets`,
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });
}

export async function reorderTicket(boardId: string, payload: { ticketId: string; toColumnId: string; toIndex: number }) {
  const headers = await resolveCsrfHeaders();
  return request<KanbanBoardSnapshot>({
    path: `/api/kanban/boards/${boardId}/tickets/reorder`,
    method: "PATCH",
    body: JSON.stringify(payload),
    headers,
  });
}

export async function createSprint(
  boardId: string,
  payload: { name: string; goal?: string; startDate: string; endDate: string; status?: "planned" | "active" | "completed" },
) {
  const headers = await resolveCsrfHeaders();
  return request<{ sprint: KanbanSprint }>({
    path: `/api/kanban/boards/${boardId}/sprints`,
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  });
}
