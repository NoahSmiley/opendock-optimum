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
import { StateNotesRepository } from "../stateNotesRepository";

class UnsupportedAuthRepo implements AuthRepository {
  private error<T>(): Promise<T> {
    return Promise.reject(
      new Error("Auth repository is not available when using the JSON data provider."),
    );
  }

  createUser(): Promise<AuthUser> {
    return this.error();
  }

  findUserByEmail(): Promise<AuthUser | null> {
    return this.error();
  }

  findUserByEmailWithPassword(): Promise<AuthUserWithPassword | null> {
    return this.error();
  }

  findUserById(): Promise<AuthUser | null> {
    return this.error();
  }

  createSession(): Promise<AuthSession> {
    return this.error();
  }

  findSessionByTokenHash(): Promise<AuthSessionWithUser | null> {
    return this.error();
  }

  revokeSession(): Promise<void> {
    return this.error();
  }
}

export function createJsonDal(): DataAccessLayer {
  return {
    kind: "json",
    auth: new UnsupportedAuthRepo(),
    projects: new StateProjectsRepository(),
    kanban: new StateKanbanRepository(),
    notes: new StateNotesRepository(),
  };
}
