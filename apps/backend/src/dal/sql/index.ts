import type {
  AuthRepository,
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  AuthUserWithPassword,
  DataAccessLayer,
} from "../index";
import { StateProjectsRepository } from "../stateProjectsRepository";
import { StateKanbanRepository } from "../stateKanbanRepository";
import { PrismaNotesRepository } from "./prismaNotesRepository";
import { prisma } from "./client";

function mapUser(user: { id: string; email: string; displayName: string | null; role: string; createdAt: Date; updatedAt: Date }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapSession(session: {
  id: string;
  userId: string;
  tokenHash: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): AuthSession {
  return {
    id: session.id,
    userId: session.userId,
    tokenHash: session.tokenHash,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

class PrismaAuthRepository implements AuthRepository {
  async createUser(input: { email: string; passwordHash: string; displayName: string | null; role: string }): Promise<AuthUser> {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        role: input.role,
      },
    });
    return mapUser(user);
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? mapUser(user) : null;
  }

  async findUserByEmailWithPassword(email: string): Promise<AuthUserWithPassword | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return { ...mapUser(user), passwordHash: user.passwordHash };
  }

  async findUserById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  }

  async createSession(input: { userId: string; tokenHash: string; userAgent: string; ipAddress: string; expiresAt: Date }): Promise<AuthSession> {
    const session = await prisma.session.create({
      data: {
        tokenHash: input.tokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
        user: {
          connect: {
            id: input.userId,
          },
        },
      },
    });
    return mapSession(session);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<AuthSessionWithUser | null> {
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!session) return null;
    return {
      ...mapSession(session),
      user: mapUser(session.user),
    };
  }

  async revokeSession(tokenHash: string): Promise<void> {
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
}

export function createSqlDal(): DataAccessLayer {
  return {
    kind: "sql",
    auth: new PrismaAuthRepository(),
    projects: new StateProjectsRepository(),
    kanban: new StateKanbanRepository(),
    notes: new PrismaNotesRepository(),
  };
}
