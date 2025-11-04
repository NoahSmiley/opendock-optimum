import { createJsonDal } from "./json";
import { createSqlDal } from "./sql";
import type { ProjectsRepository } from "./projects.types";
import type { KanbanRepository } from "./kanban.types";
import type { NotesRepository } from "./notes.types";

export type { ProjectsRepository, ProjectOverview } from "./projects.types";
export type { KanbanRepository } from "./kanban.types";
export type { NotesRepository } from "./notes.types";

export type DalProviderName = "json" | "sql";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserWithPassword extends AuthUser {
  passwordHash: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionWithUser extends AuthSession {
  user: AuthUser;
}

export interface AuthRepository {
  createUser(input: { email: string; passwordHash: string; displayName: string | null; role: string }): Promise<AuthUser>;
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserByEmailWithPassword(email: string): Promise<AuthUserWithPassword | null>;
  findUserById(id: string): Promise<AuthUser | null>;
  createSession(input: { userId: string; tokenHash: string; userAgent: string; ipAddress: string; expiresAt: Date }): Promise<AuthSession>;
  findSessionByTokenHash(tokenHash: string): Promise<AuthSessionWithUser | null>;
  revokeSession(tokenHash: string): Promise<void>;
}

export interface DataAccessLayer {
  kind: DalProviderName;
  auth: AuthRepository;
  projects: ProjectsRepository;
  kanban: KanbanRepository;
  notes: NotesRepository;
}

const providerName = normalizeProvider(process.env.OPENDOCK_DAL);

export const dal: DataAccessLayer =
  providerName === "sql" ? createSqlDal() : createJsonDal();

function normalizeProvider(raw?: string): DalProviderName {
  if (!raw) return "json";
  const normalized = raw.trim().toLowerCase();
  return normalized === "sql" ? "sql" : "json";
}
