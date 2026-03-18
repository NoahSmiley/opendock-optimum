export type Priority = "low" | "medium" | "high";
export type IssueType = "bug" | "task" | "story" | "epic";
export type SprintStatus = "planned" | "active" | "completed";

export interface Board {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  memberIds: string[];
  activeSprintId?: string;
  columns: Column[];
  tickets: Ticket[];
  sprints: Sprint[];
  epics: Epic[];
  members: BoardMember[];
  labels: Label[];
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  order: number;
  wipLimit?: number;
}

export interface Ticket {
  id: string;
  key?: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  issueType?: IssueType;
  epicId?: string;
  assigneeIds: string[];
  tags: string[];
  labelIds: string[];
  estimate?: number;
  storyPoints?: number;
  priority: Priority;
  sprintId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  order: number;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  userId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  boardId: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
}

export interface Epic {
  id: string;
  boardId: string;
  key: string;
  title: string;
  description?: string;
  color: string;
  status: "open" | "in_progress" | "done";
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  boardId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface BoardMember {
  id: string;
  name: string;
  email?: string;
  avatarColor: string;
}

export interface BoardSnapshot {
  board: Board;
  columns: Column[];
  tickets: Ticket[];
  sprints: Sprint[];
  members: BoardMember[];
  labels: Label[];
}
