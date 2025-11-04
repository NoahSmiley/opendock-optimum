
import type { ProjectType } from "./projectTypes";

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
  velocity?: number; // Average story points per sprint
}

export interface KanbanEpic {
  id: string;
  boardId: string;
  key: string; // e.g., "EPIC-1"
  title: string;
  description?: string;
  color: string;
  startDate?: string;
  endDate?: string;
  status: "open" | "in_progress" | "done";
  createdAt: string;
  updatedAt: string;
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

export type IssueType = "bug" | "task" | "story" | "epic";

export interface KanbanTicket {
  id: string;
  key?: string; // JIRA-style key (e.g., "OD-123")
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  issueType?: IssueType; // New field for issue type
  epicId?: string; // Reference to parent epic
  assigneeIds: string[];
  tags: string[];
  labelIds: string[];
  estimate?: number;
  storyPoints?: number; // Story points for estimation
  timeSpent?: number; // in seconds, calculated from time logs
  timeOriginalEstimate?: number; // Original time estimate in seconds
  timeRemaining?: number; // Time remaining in seconds
  priority: "low" | "medium" | "high";
  sprintId?: string;
  dueDate?: string;
  components?: string[]; // Component tags
  fixVersion?: string; // Target release version
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
  projectKey?: string; // e.g., "OD" for OpenDock
  projectType?: ProjectType; // Project type for adaptive UI
  createdAt: string;
  memberIds: string[];
  activeSprintId?: string;
  columns: KanbanColumn[];
  tickets: KanbanTicket[];
  sprints: KanbanSprint[];
  epics: KanbanEpic[];
  members: KanbanUser[];
  labels: KanbanLabel[];
  components?: string[]; // Available components for this board
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

// =============================================================================
// Notes Types
// =============================================================================

export interface Note {
  id: string;
  title: string;
  content: string;
  contentType?: 'markdown' | 'richtext';
  folderId?: string | null;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  children?: Folder[];
  notes?: Note[];
}

export interface BoardNote {
  id: string;
  boardId: string;
  noteId: string;
  createdAt: string;
}

export interface CardNote {
  id: string;
  cardId: string;
  noteId: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  noteCount?: number;
}

export interface CollectionNote {
  id: string;
  collectionId: string;
  noteId: string;
  createdAt: string;
}

export interface NotesResponse {
  notes: Note[];
  folders: Folder[];
  collections?: Collection[];
}

// Input types for creating/updating notes
export interface CreateNoteInput {
  title: string;
  content?: string;
  contentType?: 'markdown' | 'richtext';
  folderId?: string;
  tags?: string[];
  isPinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  contentType?: 'markdown' | 'richtext';
  folderId?: string | null;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

// Input types for folders
export interface CreateFolderInput {
  name: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateFolderInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
  parentId?: string | null;
}

// Input types for collections
export interface CreateCollectionInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
}

// Search and filter types
export interface NoteSearchParams {
  query?: string;
  tags?: string[];
  folderId?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  boardId?: string;
  limit?: number;
  offset?: number;
}

export interface NoteSearchResult {
  notes: Note[];
  total: number;
}

// Board linking types
export interface LinkNoteToBoardInput {
  noteId: string;
  boardId: string;
}

export interface LinkNoteToCardInput {
  noteId: string;
  cardId: string;
}

