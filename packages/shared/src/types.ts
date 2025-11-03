
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
  environmentId: string;
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

export interface Environment {
  id: string;
  projectId: string;
  slug: string;
  name: string;
  url?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentSummary extends Environment {
  latestDeployment?: Deployment;
  recentDeployments: Deployment[];
}

export interface ProjectsResponse {
  projects: (Project & {
    latestBuild?: Build;
    deployment?: Deployment;
    builds?: Build[];
    environments?: EnvironmentSummary[];
  })[];
}

export interface BuildRequest {
  projectId: string;
  branch?: string;
  environmentId?: string;
  environmentSlug?: string;
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
  wipLimit?: number; // Work In Progress limit (optional)
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

export interface KanbanTimeLog {
  id: string;
  ticketId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // in seconds
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanAttachment {
  id: string;
  ticketId: string;
  userId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number; // in bytes
  url: string;
  createdAt: string;
  updatedAt: string;
}

export type KanbanActivityType =
  | "ticket_created"
  | "ticket_updated"
  | "ticket_deleted"
  | "ticket_moved"
  | "ticket_assigned"
  | "comment_added"
  | "comment_deleted"
  | "attachment_added"
  | "attachment_deleted"
  | "column_created"
  | "column_updated"
  | "column_deleted"
  | "sprint_created"
  | "sprint_updated"
  | "board_updated";

export interface KanbanActivity {
  id: string;
  boardId: string;
  userId: string;
  type: KanbanActivityType;
  ticketId?: string;
  columnId?: string;
  sprintId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface KanbanLabel {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface KanbanTicket {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  assigneeIds: string[];
  tags: string[];
  labelIds: string[];
  estimate?: number;
  timeSpent?: number; // in seconds, calculated from time logs
  priority: "low" | "medium" | "high";
  sprintId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  comments?: KanbanComment[];
  timeLogs?: KanbanTimeLog[];
  attachments?: KanbanAttachment[];
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
  labels: KanbanLabel[];
}

export interface KanbanBoardSnapshot {
  board: KanbanBoard;
  columns: KanbanColumn[];
  tickets: KanbanTicket[];
  sprints: KanbanSprint[];
  members: KanbanUser[];
  labels: KanbanLabel[];
}

export interface KanbanBoardsResponse {
  boards: KanbanBoard[];
  users: KanbanUser[];
}

