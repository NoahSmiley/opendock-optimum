import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Build,
  BuildConfig,
  BuildStatus,
  CommitInfo,
  Deployment,
  Environment,
  HealthStatus,
  KanbanBoard,
  KanbanColumn,
  KanbanComment,
  KanbanBoardSnapshot,
  KanbanSprint,
  KanbanTicket,
  KanbanTimeLog,
  KanbanUser,
  KanbanActivity,
  KanbanActivityType,
  KanbanLabel,
  Project,
} from "@opendock/shared/types";

export interface AppState {
  projects: Project[];
  builds: Build[];
  deployments: Deployment[];
  environments: Environment[];
  kanbanBoards: KanbanBoard[];
  kanbanColumns: KanbanColumn[];
  kanbanTickets: KanbanTicket[];
  kanbanSprints: KanbanSprint[];
  kanbanUsers: KanbanUser[];
  kanbanComments: KanbanComment[];
  kanbanTimeLogs: KanbanTimeLog[];
  kanbanActivities: KanbanActivity[];
  kanbanLabels: KanbanLabel[];
}

const DEFAULT_STATE: AppState = {
  projects: [],
  builds: [],
  deployments: [],
  environments: [],
  kanbanBoards: [],
  kanbanColumns: [],
  kanbanTickets: [],
  kanbanSprints: [],
  kanbanUsers: [],
  kanbanComments: [],
  kanbanTimeLogs: [],
  kanbanActivities: [],
  kanbanLabels: [],
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
        environments: parsed.environments ?? [],
        kanbanBoards: parsed.kanbanBoards ?? [],
        kanbanColumns: parsed.kanbanColumns ?? [],
        kanbanTickets: parsed.kanbanTickets ?? [],
        kanbanSprints: parsed.kanbanSprints ?? [],
        kanbanUsers: parsed.kanbanUsers ?? [],
        kanbanComments: parsed.kanbanComments ?? [],
        kanbanTimeLogs: parsed.kanbanTimeLogs ?? [],
        kanbanActivities: parsed.kanbanActivities ?? [],
        kanbanLabels: parsed.kanbanLabels ?? [],
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
      environments: overrides.environments ? [...overrides.environments] : [],
      kanbanBoards: overrides.kanbanBoards ? [...overrides.kanbanBoards] : [],
      kanbanColumns: overrides.kanbanColumns ? [...overrides.kanbanColumns] : [],
      kanbanTickets: overrides.kanbanTickets ? [...overrides.kanbanTickets] : [],
      kanbanSprints: overrides.kanbanSprints ? [...overrides.kanbanSprints] : [],
      kanbanTimeLogs: overrides.kanbanTimeLogs ? [...overrides.kanbanTimeLogs] : [],
      kanbanUsers: overrides.kanbanUsers ? [...overrides.kanbanUsers] : [],
      kanbanComments: overrides.kanbanComments ? [...overrides.kanbanComments] : [],
      kanbanActivities: overrides.kanbanActivities ? [...overrides.kanbanActivities] : [],
      kanbanLabels: overrides.kanbanLabels ? [...overrides.kanbanLabels] : [],
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

  listEnvironments(projectId?: string): Environment[] {
    if (!projectId) {
      return [...this.state.environments];
    }
    return this.state.environments.filter((env) => env.projectId === projectId).sort((a, b) => a.order - b.order);
  }

  findEnvironmentById(environmentId: string): Environment | undefined {
    return this.state.environments.find((env) => env.id === environmentId);
  }

  findEnvironmentBySlug(projectId: string, slug: string): Environment | undefined {
    const normalized = slug.toLowerCase();
    return this.state.environments.find((env) => env.projectId === projectId && env.slug.toLowerCase() === normalized);
  }

  createEnvironment(input: { projectId: string; slug: string; name: string; url?: string; order?: number }): Environment {
    const now = new Date().toISOString();
    const environment: Environment = {
      id: randomUUID(),
      projectId: input.projectId,
      slug: input.slug,
      name: input.name,
      url: input.url,
      order: input.order ?? this.listEnvironments(input.projectId).length,
      createdAt: now,
      updatedAt: now,
    };
    this.state.environments.push(environment);
    this.persist();
    return environment;
  }

  ensureDefaultEnvironments(projectId: string): void {
    const existing = this.listEnvironments(projectId);
    if (existing.length > 0) return;
    const defaults: Array<{ slug: string; name: string }> = [
      { slug: "development", name: "Development" },
      { slug: "staging", name: "Staging" },
      { slug: "production", name: "Production" },
    ];
    defaults.forEach((env, index) => {
      this.createEnvironment({
        projectId,
        slug: env.slug,
        name: env.name,
        order: index,
      });
    });
  }

  resolveEnvironment(projectId: string, options: { environmentId?: string; slug?: string } = {}): Environment | undefined {
    if (options.environmentId) {
      return this.findEnvironmentById(options.environmentId);
    }
    if (options.slug) {
      const env = this.findEnvironmentBySlug(projectId, options.slug);
      if (env) {
        return env;
      }
    }
    const preferred = this.findEnvironmentBySlug(projectId, "production");
    if (preferred) return preferred;
    let environments = this.listEnvironments(projectId);
    if (environments.length === 0) {
      this.ensureDefaultEnvironments(projectId);
      environments = this.listEnvironments(projectId);
    }
    return environments[0];
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
    this.ensureDefaultEnvironments(project.id);
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

  listDeploymentsByEnvironment(environmentId: string): Deployment[] {
    return this.state.deployments.filter((deployment) => deployment.environmentId === environmentId);
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

  findActiveDeploymentByEnvironment(environmentId: string): Deployment | undefined {
    return this.state.deployments
      .filter((deployment) => deployment.environmentId === environmentId)
      .find((deployment) => deployment.status === "running");
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
      labels: [],
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

  updateColumn(boardId: string, columnId: string, updates: { title?: string; wipLimit?: number | null }): KanbanColumn | undefined {
    const column = this.state.kanbanColumns.find((c) => c.id === columnId && c.boardId === boardId);
    if (!column) return undefined;
    if (updates.title !== undefined) {
      column.title = updates.title;
    }
    if (updates.wipLimit !== undefined) {
      column.wipLimit = updates.wipLimit === null ? undefined : updates.wipLimit;
    }
    this.persist();
    return column;
  }

  deleteColumn(boardId: string, columnId: string): boolean {
    const board = this.state.kanbanBoards.find((b) => b.id === boardId);
    if (!board) return false;

    const columnIndex = this.state.kanbanColumns.findIndex((c) => c.id === columnId && c.boardId === boardId);
    if (columnIndex === -1) return false;

    // Get the first column to move tickets to (or create one if none exist)
    const remainingColumns = this.state.kanbanColumns.filter((c) => c.boardId === boardId && c.id !== columnId);
    if (remainingColumns.length === 0) {
      // Can't delete the last column
      return false;
    }

    const targetColumn = remainingColumns[0];

    // Move all tickets from the deleted column to the first column
    const ticketsInColumn = this.state.kanbanTickets.filter((t) => t.columnId === columnId);
    ticketsInColumn.forEach((ticket) => {
      ticket.columnId = targetColumn.id;
    });

    // Delete the column
    this.state.kanbanColumns.splice(columnIndex, 1);
    this.persist();
    return true;
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

  createTicket(
    boardId: string,
    input: {
      columnId: string;
      title: string;
      description?: string;
      assigneeIds?: string[];
      tags?: string[];
      labelIds?: string[];
      estimate?: number;
      priority?: "low" | "medium" | "high";
      sprintId?: string;
      dueDate?: string;
    },
  ): KanbanTicket {
    const order = this.state.kanbanTickets.filter((ticket) => ticket.columnId === input.columnId).length;
    const ticket: KanbanTicket = {
      id: randomUUID(),
      boardId,
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      assigneeIds: input.assigneeIds ?? [],
      tags: input.tags ?? [],
      labelIds: input.labelIds ?? [],
      estimate: input.estimate,
      priority: input.priority ?? "medium",
      sprintId: input.sprintId,
      dueDate: input.dueDate,
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
    const sameColumn = fromColumnId === toColumnId;

    const destinationTickets = this.state.kanbanTickets
      .filter((item) => item.columnId === toColumnId && item.id !== ticketId)
      .sort((a, b) => a.order - b.order);

    const clamped = Math.max(0, Math.min(toIndex, destinationTickets.length));
    ticket.columnId = toColumnId;
    destinationTickets.splice(clamped, 0, ticket);
    destinationTickets.forEach((item, index) => {
      item.order = index;
    });

    if (!sameColumn) {
      const sourceTickets = this.state.kanbanTickets
        .filter((item) => item.columnId === fromColumnId && item.id !== ticketId)
        .sort((a, b) => a.order - b.order);
      sourceTickets.forEach((item, index) => {
        item.order = index;
      });
    }

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
    const labels = this.state.kanbanLabels.filter((label) => label.boardId === boardId);

    return {
      board: {
        ...board,
        columns,
        tickets,
        sprints,
        members,
        labels,
      },
      columns,
      tickets,
      sprints,
      members,
      labels,
    };
  }

  getTicket(ticketId: string): KanbanTicket | undefined {
    return this.state.kanbanTickets.find((ticket) => ticket.id === ticketId);
  }

  deleteTicket(ticketId: string): boolean {
    const index = this.state.kanbanTickets.findIndex((ticket) => ticket.id === ticketId);
    if (index === -1) return false;
    this.state.kanbanTickets.splice(index, 1);
    // Also delete all comments associated with this ticket
    this.state.kanbanComments = this.state.kanbanComments.filter((comment) => comment.ticketId !== ticketId);
    this.persist();
    return true;
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

  // Time log methods
  startTimeLog(ticketId: string, userId: string, startedAt?: string): KanbanTimeLog | null {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return null;

    // Check if user already has an active timer for this ticket
    const existingActive = this.state.kanbanTimeLogs.find(
      (log) => log.ticketId === ticketId && log.userId === userId && !log.endedAt
    );
    if (existingActive) return null;

    const timeLog: KanbanTimeLog = {
      id: randomUUID(),
      ticketId,
      userId,
      startedAt: startedAt || new Date().toISOString(),
      duration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.kanbanTimeLogs.push(timeLog);
    this.persist();
    return timeLog;
  }

  stopTimeLog(timeLogId: string, endedAt?: string): KanbanTimeLog | null {
    const timeLog = this.state.kanbanTimeLogs.find((log) => log.id === timeLogId);
    if (!timeLog || timeLog.endedAt) return null;

    const endTime = endedAt || new Date().toISOString();
    const duration = Math.floor((new Date(endTime).getTime() - new Date(timeLog.startedAt).getTime()) / 1000);

    timeLog.endedAt = endTime;
    timeLog.duration = duration;
    timeLog.updatedAt = new Date().toISOString();

    // Update ticket's total time spent
    const ticket = this.getTicket(timeLog.ticketId);
    if (ticket) {
      const allLogs = this.state.kanbanTimeLogs.filter((log) => log.ticketId === ticket.id);
      const totalTime = allLogs.reduce((sum, log) => sum + log.duration, 0);
      ticket.timeSpent = totalTime;
    }

    this.persist();
    return timeLog;
  }

  getActiveTimeLog(ticketId: string, userId: string): KanbanTimeLog | null {
    return this.state.kanbanTimeLogs.find(
      (log) => log.ticketId === ticketId && log.userId === userId && !log.endedAt
    ) || null;
  }

  getTimeLog(timeLogId: string): KanbanTimeLog | undefined {
    return this.state.kanbanTimeLogs.find((log) => log.id === timeLogId);
  }

  listTimeLogs(ticketId: string): KanbanTimeLog[] {
    return this.state.kanbanTimeLogs
      .filter((log) => log.ticketId === ticketId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  deleteTimeLog(timeLogId: string): boolean {
    const timeLog = this.getTimeLog(timeLogId);
    if (!timeLog) return false;

    const index = this.state.kanbanTimeLogs.findIndex((log) => log.id === timeLogId);
    if (index === -1) return false;

    this.state.kanbanTimeLogs.splice(index, 1);

    // Recalculate ticket's total time spent
    const ticket = this.getTicket(timeLog.ticketId);
    if (ticket) {
      const allLogs = this.state.kanbanTimeLogs.filter((log) => log.ticketId === ticket.id);
      const totalTime = allLogs.reduce((sum, log) => sum + log.duration, 0);
      ticket.timeSpent = totalTime;
    }

    this.persist();
    return true;
  }

  // Activity tracking methods
  createActivity(
    boardId: string,
    userId: string,
    type: KanbanActivityType,
    options?: {
      ticketId?: string;
      columnId?: string;
      sprintId?: string;
      metadata?: Record<string, unknown>;
    }
  ): KanbanActivity {
    const activity: KanbanActivity = {
      id: randomUUID(),
      boardId,
      userId,
      type,
      ticketId: options?.ticketId,
      columnId: options?.columnId,
      sprintId: options?.sprintId,
      metadata: options?.metadata,
      createdAt: new Date().toISOString(),
    };
    this.state.kanbanActivities.push(activity);
    this.persist();
    return activity;
  }

  listActivities(boardId: string, limit?: number): KanbanActivity[] {
    const activities = this.state.kanbanActivities
      .filter((activity) => activity.boardId === boardId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return limit ? activities.slice(0, limit) : activities;
  }

  listTicketActivities(ticketId: string, limit?: number): KanbanActivity[] {
    const activities = this.state.kanbanActivities
      .filter((activity) => activity.ticketId === ticketId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return limit ? activities.slice(0, limit) : activities;
  }

  // Label management methods
  createLabel(boardId: string, name: string, color: string): KanbanLabel {
    const label: KanbanLabel = {
      id: randomUUID(),
      boardId,
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    this.state.kanbanLabels.push(label);
    this.persist();
    return label;
  }

  updateLabel(labelId: string, updates: { name?: string; color?: string }): KanbanLabel | null {
    const label = this.state.kanbanLabels.find((l) => l.id === labelId);
    if (!label) return null;

    if (updates.name !== undefined) label.name = updates.name;
    if (updates.color !== undefined) label.color = updates.color;

    this.persist();
    return label;
  }

  deleteLabel(labelId: string): boolean {
    const index = this.state.kanbanLabels.findIndex((l) => l.id === labelId);
    if (index === -1) return false;

    // Remove label from all tickets
    this.state.kanbanTickets.forEach((ticket) => {
      ticket.labelIds = ticket.labelIds.filter((id) => id !== labelId);
    });

    this.state.kanbanLabels.splice(index, 1);
    this.persist();
    return true;
  }

  listLabels(boardId: string): KanbanLabel[] {
    return this.state.kanbanLabels
      .filter((label) => label.boardId === boardId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getLabel(labelId: string): KanbanLabel | undefined {
    return this.state.kanbanLabels.find((l) => l.id === labelId);
  }
}

export const store = new StateStore();
