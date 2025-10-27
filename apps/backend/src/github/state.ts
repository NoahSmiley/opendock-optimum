import { randomBytes } from "crypto";

interface GitHubStateRecord {
  createdAt: number;
  redirectTo: string | null;
}

interface GitHubTokenRecord {
  accessToken: string;
  tokenType: string;
  scope?: string;
  updatedAt: number;
}

const STATE_TTL_MS = 5 * 60 * 1000;

const stateStore = new Map<string, GitHubStateRecord>();
const tokenStore = new Map<string, GitHubTokenRecord>();

function sweepExpiredStates() {
  const cutoff = Date.now() - STATE_TTL_MS;
  for (const [state, record] of stateStore.entries()) {
    if (record.createdAt < cutoff) {
      stateStore.delete(state);
    }
  }
}

export function createGitHubState(redirectTo: string | null = null): string {
  sweepExpiredStates();
  const state = randomBytes(16).toString("hex");
  stateStore.set(state, {
    createdAt: Date.now(),
    redirectTo,
  });
  return state;
}

export function consumeGitHubState(state: string): GitHubStateRecord | null {
  sweepExpiredStates();
  const record = stateStore.get(state) ?? null;
  if (record) {
    stateStore.delete(state);
  }
  return record;
}

export function storeGitHubToken(userId: string, token: GitHubTokenRecord): void {
  tokenStore.set(userId, token);
}

export function getGitHubToken(userId: string): GitHubTokenRecord | null {
  return tokenStore.get(userId) ?? null;
}
