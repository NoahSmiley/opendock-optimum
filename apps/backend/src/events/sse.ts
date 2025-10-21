import type { Response } from "express";

export type KanbanEvent =
  | { type: "board-snapshot"; boardId: string }
  | { type: "ticket-created"; boardId: string; ticketId: string }
  | { type: "ticket-updated"; boardId: string; ticketId: string }
  | { type: "ticket-reordered"; boardId: string }
  | { type: "column-created"; boardId: string; columnId: string }
  | { type: "sprint-created"; boardId: string; sprintId: string };

interface Subscriber {
  res: Response;
}

const HEARTBEAT_INTERVAL = 25_000;

class KanbanEventBus {
  private readonly subscribers = new Map<string, Set<Subscriber>>();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  subscribe(boardId: string, res: Response): () => void {
    const entry = this.subscribers.get(boardId) ?? new Set<Subscriber>();
    const subscriber = { res } satisfies Subscriber;
    entry.add(subscriber);
    this.subscribers.set(boardId, entry);

    if (!this.heartbeatTimer) {
      this.startHeartbeats();
    }

    return () => {
      const current = this.subscribers.get(boardId);
      if (!current) return;
      current.delete(subscriber);
      if (current.size === 0) {
        this.subscribers.delete(boardId);
      }
      if (this.subscribers.size === 0) {
        this.stopHeartbeats();
      }
    };
  }

  broadcast(event: KanbanEvent): void {
    const targets = this.subscribers.get(event.boardId);
    if (!targets || targets.size === 0) {
      return;
    }
    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
    targets.forEach(({ res }) => {
      res.write(payload);
    });
  }

  private startHeartbeats(): void {
    this.heartbeatTimer = setInterval(() => {
      this.subscribers.forEach((clientSet) => {
        clientSet.forEach(({ res }) => {
          res.write(`event: heartbeat\ndata: {}\n\n`);
        });
      });
    }, HEARTBEAT_INTERVAL).unref?.();
  }

  private stopHeartbeats(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  clearAll(): void {
    this.stopHeartbeats();
    this.subscribers.forEach((subs) => subs.clear());
    this.subscribers.clear();
  }
}

export const kanbanEvents = new KanbanEventBus();
