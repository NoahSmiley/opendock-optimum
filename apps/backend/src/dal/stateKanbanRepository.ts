import type {
  KanbanBoard,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanComment,
  KanbanSprint,
  KanbanTicket,
  KanbanUser,
} from "@opendock/shared/types";
import type {
  KanbanCreateBoardInput,
  KanbanCreateColumnInput,
  KanbanCreateSprintInput,
  KanbanCreateTicketInput,
  KanbanReorderTicketInput,
  KanbanUpdateTicketInput,
  KanbanUpdateBoardInput,
} from "@opendock/shared/kanban";
import { store } from "../state";
import { kanbanEvents } from "../events";
import type { KanbanRepository } from "./kanban.types";

function sanitizeTicketUpdate(updates: KanbanUpdateTicketInput) {
  return {
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.assigneeIds !== undefined ? { assigneeIds: updates.assigneeIds } : {}),
    ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
    ...(updates.estimate !== undefined ? { estimate: updates.estimate ?? undefined } : {}),
    ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
    ...(updates.sprintId !== undefined ? { sprintId: updates.sprintId ?? undefined } : {}),
  } satisfies Partial<KanbanTicket>;
}

function sanitizeBoardUpdate(updates: KanbanUpdateBoardInput) {
  return {
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.description !== undefined ? { description: updates.description ?? undefined } : {}),
    ...(updates.projectId !== undefined ? { projectId: updates.projectId ?? undefined } : {}),
  } satisfies Partial<KanbanBoard>;
}

export class StateKanbanRepository implements KanbanRepository {
  async listBoards(): Promise<KanbanBoard[]> {
    return store.listBoards();
  }

  async boardSnapshot(boardId: string): Promise<KanbanBoardSnapshot | null> {
    return store.boardSnapshot(boardId) ?? null;
  }

  async listUsers(): Promise<KanbanUser[]> {
    return store.listUsers();
  }

  async createBoard(input: KanbanCreateBoardInput): Promise<KanbanBoardSnapshot> {
    const snapshot = store.createBoard(input);
    kanbanEvents.broadcast({ type: "board-snapshot", boardId: snapshot.board.id });
    return snapshot;
  }

  async createColumn(boardId: string, input: KanbanCreateColumnInput): Promise<KanbanColumn> {
    const column = store.createColumn(boardId, input);
    kanbanEvents.broadcast({ type: "column-created", boardId, columnId: column.id });
    return column;
  }

  async createSprint(boardId: string, input: KanbanCreateSprintInput): Promise<KanbanSprint> {
    const sprint = store.createSprint(boardId, input);
    kanbanEvents.broadcast({ type: "sprint-created", boardId, sprintId: sprint.id });
    return sprint;
  }

  async createTicket(boardId: string, input: KanbanCreateTicketInput): Promise<KanbanTicket> {
    const ticket = store.createTicket(boardId, {
      columnId: input.columnId,
      title: input.title,
      description: input.description,
      assigneeIds: input.assigneeIds ?? [],
      tags: input.tags ?? [],
      estimate: input.estimate,
      priority: input.priority,
      sprintId: input.sprintId,
    });
    kanbanEvents.broadcast({ type: "ticket-created", boardId, ticketId: ticket.id });
    return ticket;
  }

  async updateBoard(boardId: string, input: KanbanUpdateBoardInput): Promise<KanbanBoard | null> {
    const board = store.updateBoard(boardId, sanitizeBoardUpdate(input));
    if (!board) return null;
    kanbanEvents.broadcast({ type: "board-snapshot", boardId });
    return board;
  }

  async updateTicket(ticketId: string, updates: KanbanUpdateTicketInput): Promise<KanbanTicket | null> {
    const ticket = store.updateTicket(ticketId, sanitizeTicketUpdate(updates));
    if (!ticket) return null;
    kanbanEvents.broadcast({ type: "ticket-updated", boardId: ticket.boardId, ticketId });
    return ticket;
  }

  async reorderTicket(boardId: string, input: KanbanReorderTicketInput): Promise<KanbanBoardSnapshot | null> {
    const snapshot = store.moveTicket(input.ticketId, input.toColumnId, input.toIndex) ?? null;
    if (snapshot) {
      kanbanEvents.broadcast({ type: "ticket-reordered", boardId });
    }
    return snapshot;
  }

  async addComment(ticketId: string, userId: string, content: string): Promise<KanbanComment | null> {
    const comment = store.addComment(ticketId, userId, content);
    if (!comment) return null;
    const ticket = store.getTicket(ticketId);
    if (ticket) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
    }
    return comment;
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const comment = store.getComment(commentId);
    if (!comment) return false;
    const ticket = store.getTicket(comment.ticketId);
    const success = store.deleteComment(commentId);
    if (success && ticket) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
    }
    return success;
  }
}
