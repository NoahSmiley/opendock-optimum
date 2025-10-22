
export type BuildStatus = "queued" | "running" | "success" | "failed";
export type HealthStatus = "unknown" | "up" | "down";

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
}

export interface BuildConfig {
  installCommand?: string;
  buildCommand?: string;
  workspacePath?: string;
}

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  createdAt: string;
  latestCommit?: CommitInfo;
  buildConfig?: BuildConfig;
}

export interface Build {
  id: string;
  projectId: string;
  status: BuildStatus;
  branch: string;
  createdAt: string;
  updatedAt: string;
  commit?: CommitInfo;
  logs: string[];
}

export type DeploymentStatus = "running" | "stopped" | "failed";

export interface Deployment {
  id: string;
  projectId: string;
  buildId: string;
  port: number;
  containerId: string;
  startedAt: string;
  updatedAt: string;
  status: DeploymentStatus;
  healthStatus: HealthStatus;
  lastHealthCheck: string | null;
  healthUrl?: string;
  mode: "simulated" | "docker";
}

export interface ProjectsResponse {
  projects: (Project & {
    latestBuild?: Build;
    deployment?: Deployment;
    builds?: Build[];
  })[];
}

export interface BuildRequest {
  projectId: string;
  branch?: string;
  commit?: CommitInfo;
  reason: "webhook" | "manual";
}

export interface KanbanUser {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
}

export interface KanbanColumn {
  id: string;
  boardId: string;
  title: string;
  order: number;
}

export interface KanbanSprint {
  id: string;
  boardId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: "planned" | "active" | "completed";
}

export interface KanbanComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanTicket {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assigneeIds: string[];
  tags: string[];
  estimate?: number;
  priority: "low" | "medium" | "high";
  sprintId?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  comments?: KanbanComment[];
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  createdAt: string;
  memberIds: string[];
  activeSprintId?: string;
  columns: KanbanColumn[];
  tickets: KanbanTicket[];
  sprints: KanbanSprint[];
  members: KanbanUser[];
}

export interface KanbanBoardSnapshot {
  board: KanbanBoard;
  columns: KanbanColumn[];
  tickets: KanbanTicket[];
  sprints: KanbanSprint[];
  members: KanbanUser[];
}

export interface KanbanBoardsResponse {
  boards: KanbanBoard[];
  users: KanbanUser[];
}

