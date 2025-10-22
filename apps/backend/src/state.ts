import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Build,
  BuildConfig,
  BuildStatus,
  CommitInfo,
  Deployment,
  HealthStatus,
  KanbanBoard,
  KanbanColumn,
  KanbanComment,
  KanbanBoardSnapshot,
  KanbanSprint,
  KanbanTicket,
  KanbanUser,
  Project,
} from "@opendock/shared/types";

export interface AppState {
  projects: Project[];
  builds: Build[];
  deployments: Deployment[];
  kanbanBoards: KanbanBoard[];
  kanbanColumns: KanbanColumn[];
  kanbanTickets: KanbanTicket[];
  kanbanSprints: KanbanSprint[];
  kanbanUsers: KanbanUser[];
  kanbanComments: KanbanComment[];
}

const DEFAULT_STATE: AppState = {
  projects: [],
  builds: [],
  deployments: [],
  kanbanBoards: [],
  kanbanColumns: [],
  kanbanTickets: [],
  kanbanSprints: [],
  kanbanUsers: [],
  kanbanComments: [],
};

export class StateStore {
  private state: AppState;
  private readonly filePath: string;

  constructor(fileName = "state.json") {
    const dataDir = path.resolve(__dirname, "../data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, fileName);
    this.state = this.read();
  }

  private read(): AppState {
    if (!fs.existsSync(this.filePath)) {
      return { ...DEFAULT_STATE };
    }
    try {
      const contents = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(contents) as Partial<AppState>;
      return {
        projects: parsed.projects ?? [],
        builds: parsed.builds ?? [],
        deployments: parsed.deployments ?? [],
        kanbanBoards: parsed.kanbanBoards ?? [],
        kanbanColumns: parsed.kanbanColumns ?? [],
        kanbanTickets: parsed.kanbanTickets ?? [],
        kanbanSprints: parsed.kanbanSprints ?? [],
        kanbanUsers: parsed.kanbanUsers ?? [],
        kanbanComments: parsed.kanbanComments ?? [],
      };
    } catch (error) {
      console.error("[state] failed to parse state file", error);
      return { ...DEFAULT_STATE };
    }
  }

  private persist(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), "utf-8");
  }

  snapshot(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  reset(overrides: Partial<AppState> = {}): void {
    this.state = {
      projects: overrides.projects ? [...overrides.projects] : [],
      builds: overrides.builds ? [...overrides.builds] : [],
      deployments: overrides.deployments ? [...overrides.deployments] : [],
      kanbanBoards: overrides.kanbanBoards ? [...overrides.kanbanBoards] : [],
      kanbanColumns: overrides.kanbanColumns ? [...overrides.kanbanColumns] : [],
      kanbanTickets: overrides.kanbanTickets ? [...overrides.kanbanTickets] : [],
      kanbanSprints: overrides.kanbanSprints ? [...overrides.kanbanSprints] : [],
      kanbanUsers: overrides.kanbanUsers ? [...overrides.kanbanUsers] : [],
      kanbanComments: overrides.kanbanComments ? [...overrides.kanbanComments] : [],
    };
    this.persist();
  }

  listProjects(): Project[] {
    return [...this.state.projects];
  }

  findProject(projectId: string): Project | undefined {
    return this.state.projects.find((project) => project.id === projectId);
  }

  findProjectByRepo(repoUrl: string): Project | undefined {
    const normalized = repoUrl.replace(/\.git$/, "").toLowerCase();
    return this.state.projects.find((project) => project.repoUrl.replace(/\.git$/, "").toLowerCase() === normalized);
  }

  createProject(input: { name: string; repoUrl: string; branch: string; buildConfig?: BuildConfig }): Project {
    const project: Project = {
      id: randomUUID(),
      name: input.name,
      repoUrl: input.repoUrl,
      branch: input.branch,
      createdAt: new Date().toISOString(),
      buildConfig: input.buildConfig ?? {},
    };
    this.state.projects.push(project);
    this.persist();
    return project;
  }

  updateProject(projectId: string, updates: Partial<Project>): Project | undefined {
    const project = this.findProject(projectId);
    if (!project) return undefined;
    project.name = updates.name ?? project.name;
    project.branch = updates.branch ?? project.branch;
    if (updates.buildConfig) {
      const current = { ...(project.buildConfig ?? {}) };
      (Object.entries(updates.buildConfig) as [keyof BuildConfig, BuildConfig[keyof BuildConfig]][]).forEach(([key, value]) => {
        if (value === undefined) {
          delete current[key];
        } else {
          current[key] = value;
        }
      });
      project.buildConfig = Object.keys(current).length > 0 ? current : undefined;
    }
    this.persist();
    return project;
  }

  appendCommit(projectId: string, commit: CommitInfo): void {
    const project = this.findProject(projectId);
    if (!project) return;
    project.latestCommit = commit;
    this.persist();
  }

  createBuild(projectId: string, branch: string, commit?: CommitInfo): Build {
    const build: Build = {
      id: randomUUID(),
      projectId,
      status: "queued",
      branch,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commit,
      logs: [],
    };
    this.state.builds.push(build);
    this.persist();
    return build;
  }

  updateBuild(buildId: string, updates: Partial<Omit<Build, "id" | "projectId" | "createdAt" | "logs">>): Build | undefined {
    const build = this.state.builds.find((item) => item.id === buildId);
    if (!build) return undefined;
    Object.assign(build, updates);
    build.updatedAt = new Date().toISOString();
    this.persist();
    return build;
  }

  setBuildStatus(buildId: string, status: BuildStatus): void {
    const build = this.state.builds.find((item) => item.id === buildId);
    if (!build) return;
    build.status = status;
    build.updatedAt = new Date().toISOString();
    this.persist();
  }

  appendBuildLog(buildId: string, message: string): void {
    const build = this.state.builds.find((item) => item.id === buildId);
    if (!build) return;
    build.logs.push(`[${new Date().toISOString()}] ${message}`);
    build.updatedAt = new Date().toISOString();
    this.persist();
  }

  listBuilds(projectId: string): Build[] {
    return this.state.builds.filter((build) => build.projectId === projectId);
  }

  createDeployment(input: Omit<Deployment, "id" | "startedAt" | "updatedAt" | "healthStatus" | "lastHealthCheck">): Deployment {
    const deployment: Deployment = {
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      healthStatus: "unknown",
      lastHealthCheck: null,
      ...input,
    };
    this.state.deployments.push(deployment);
    this.persist();
    return deployment;
  }

  updateDeployment(deploymentId: string, updates: Partial<Deployment>): Deployment | undefined {
    const deployment = this.state.deployments.find((item) => item.id === deploymentId);
    if (!deployment) return undefined;
    Object.assign(deployment, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return deployment;
  }

  findDeploymentByProject(projectId: string): Deployment | undefined {
    return this.state.deployments.find((deployment) => deployment.projectId === projectId && deployment.status === "running");
  }

  updateHealth(deploymentId: string, status: HealthStatus): void {
    const deployment = this.state.deployments.find((item) => item.id === deploymentId);
    if (!deployment) return;
    deployment.healthStatus = status;
    deployment.lastHealthCheck = new Date().toISOString();
    deployment.updatedAt = new Date().toISOString();
    this.persist();
  }

  // Kanban helpers
  listBoards(): KanbanBoard[] {
    return [...this.state.kanbanBoards];
  }

  listUsers(): KanbanUser[] {
    return [...this.state.kanbanUsers];
  }

  upsertUser(input: { name: string; email?: string }): KanbanUser {
    const existing = this.state.kanbanUsers.find((user) => user.email?.toLowerCase() === input.email?.toLowerCase() || user.name.toLowerCase() === input.name.toLowerCase());
    if (existing) {
      if (input.email && !existing.email) {
        existing.email = input.email;
        this.persist();
      }
      return existing;
    }
    const palette = ["#0EA5E9", "#F97316", "#10B981", "#6366F1", "#EC4899", "#F59E0B"];
    const user: KanbanUser = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      avatarColor: palette[Math.floor(Math.random() * palette.length)],
    };
    this.state.kanbanUsers.push(user);
    this.persist();
    return user;
  }

  createBoard(input: { name: string; description?: string; projectId?: string; members?: { name: string; email?: string }[] }): KanbanBoardSnapshot {
    const memberIds = (input.members ?? []).map((member) => this.upsertUser(member).id);
    const board: KanbanBoard = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      projectId: input.projectId,
      createdAt: new Date().toISOString(),
      memberIds,
      columns: [],
      tickets: [],
      sprints: [],
      members: [],
    };
    this.state.kanbanBoards.push(board);
    const defaultColumns = ["Backlog", "In Progress", "Review", "Done"];
    defaultColumns.forEach((title, index) => {
      this.createColumn(board.id, { title, order: index });
    });
    this.persist();
    const snapshot = this.boardSnapshot(board.id);
    if (!snapshot) {
      throw new Error("Failed to create board snapshot");
    }
    return snapshot;
  }

  updateBoard(boardId: string, updates: Partial<Pick<KanbanBoard, "name" | "description" | "projectId">>): KanbanBoard | undefined {
    const board = this.state.kanbanBoards.find((item) => item.id === boardId);
    if (!board) return undefined;
    if (updates.name !== undefined) {
      board.name = updates.name;
    }
    if (updates.description !== undefined) {
      board.description = updates.description ?? undefined;
    }
    if (updates.projectId !== undefined) {
      board.projectId = updates.projectId ?? undefined;
    }
    this.persist();
    return board;
  }

  createColumn(boardId: string, input: { title: string; order?: number }): KanbanColumn {
    const column: KanbanColumn = {
      id: randomUUID(),
      boardId,
      title: input.title,
      order: input.order ?? this.state.kanbanColumns.filter((column) => column.boardId === boardId).length,
    };
    this.state.kanbanColumns.push(column);
    this.persist();
    return column;
  }

  createSprint(boardId: string, input: { name: string; goal?: string; startDate: string; endDate: string; status?: "planned" | "active" | "completed" }): KanbanSprint {
    const sprint: KanbanSprint = {
      id: randomUUID(),
      boardId,
      name: input.name,
      goal: input.goal,
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status ?? "planned",
    };
    this.state.kanbanSprints.push(sprint);
    this.persist();
    return sprint;
  }

  createTicket(boardId: string, input: { columnId: string; title: string; description?: string; assigneeIds?: string[]; tags?: string[]; estimate?: number; priority?: "low" | "medium" | "high"; sprintId?: string }): KanbanTicket {
    const order = this.state.kanbanTickets.filter((ticket) => ticket.columnId === input.columnId).length;
    const ticket: KanbanTicket = {
      id: randomUUID(),
      boardId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      assigneeIds: input.assigneeIds ?? [],
      tags: input.tags ?? [],
      estimate: input.estimate,
      priority: input.priority ?? "medium",
      sprintId: input.sprintId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order,
    };
    this.state.kanbanTickets.push(ticket);
    this.persist();
    return ticket;
  }

  updateTicket(ticketId: string, updates: Partial<Omit<KanbanTicket, "id" | "boardId" | "createdAt">>): KanbanTicket | undefined {
    const ticket = this.state.kanbanTickets.find((item) => item.id === ticketId);
    if (!ticket) return undefined;
    Object.assign(ticket, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return ticket;
  }

  moveTicket(ticketId: string, toColumnId: string, toIndex: number): KanbanBoardSnapshot | undefined {
    const ticket = this.state.kanbanTickets.find((item) => item.id === ticketId);
    if (!ticket) return undefined;
    const fromColumnId = ticket.columnId;
    ticket.columnId = toColumnId;
    const affected = this.state.kanbanTickets.filter((item) => item.columnId === toColumnId && item.id !== ticketId);
    const clamped = Math.max(0, Math.min(toIndex, affected.length));
    affected.splice(clamped, 0, ticket);
    affected.forEach((item, index) => {
      item.order = index;
    });
    const originalColumnTickets = this.state.kanbanTickets
      .filter((item) => item.columnId === fromColumnId && item.id !== ticketId)
      .sort((a, b) => a.order - b.order)
      .map((item, index) => {
        item.order = index;
        return item;
      });
    originalColumnTickets;
    ticket.updatedAt = new Date().toISOString();
    this.persist();
    return this.boardSnapshot(ticket.boardId);
  }

  boardSnapshot(boardId: string): KanbanBoardSnapshot | undefined {
    const board = this.state.kanbanBoards.find((item) => item.id === boardId);
    if (!board) return undefined;
    const columns = this.state.kanbanColumns.filter((column) => column.boardId === boardId).sort((a, b) => a.order - b.order);
    const rawTickets = this.state.kanbanTickets.filter((ticket) => ticket.boardId === boardId);
    const tickets = rawTickets.map((ticket) => ({
      ...ticket,
      comments: this.state.kanbanComments.filter((comment) => comment.ticketId === ticket.id),
    }));
    const sprints = this.state.kanbanSprints.filter((sprint) => sprint.boardId === boardId);
    const members = board.memberIds
      .map((id) => this.state.kanbanUsers.find((user) => user.id === id))
      .filter((user): user is KanbanUser => Boolean(user));

    return {
      board: {
        ...board,
        columns,
        tickets,
        sprints,
        members,
      },
      columns,
      tickets,
      sprints,
      members,
    };
  }

  getTicket(ticketId: string): KanbanTicket | undefined {
    return this.state.kanbanTickets.find((ticket) => ticket.id === ticketId);
  }

  addComment(ticketId: string, userId: string, content: string): KanbanComment | null {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return null;

    const comment: KanbanComment = {
      id: randomUUID(),
      ticketId,
      userId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.kanbanComments.push(comment);
    this.persist();
    return comment;
  }

  getComment(commentId: string): KanbanComment | undefined {
    return this.state.kanbanComments.find((comment) => comment.id === commentId);
  }

  deleteComment(commentId: string): boolean {
    const index = this.state.kanbanComments.findIndex((comment) => comment.id === commentId);
    if (index === -1) return false;
    this.state.kanbanComments.splice(index, 1);
    this.persist();
    return true;
  }
}

export const store = new StateStore();
