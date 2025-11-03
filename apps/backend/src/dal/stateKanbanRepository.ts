import type {
  KanbanBoard,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanComment,
  KanbanSprint,
  KanbanTicket,
  KanbanTimeLog,
  KanbanUser,
  KanbanActivity,
  KanbanLabel,
  KanbanAttachment,
} from "@opendock/shared/types";
import type {
  KanbanCreateBoardInput,
  KanbanCreateColumnInput,
  KanbanCreateSprintInput,
  KanbanCreateTicketInput,
  KanbanCreateTimeLogInput,
  KanbanReorderTicketInput,
  KanbanStopTimeLogInput,
  KanbanUpdateTicketInput,
  KanbanUpdateBoardInput,
  KanbanCreateLabelInput,
  KanbanUpdateLabelInput,
} from "@opendock/shared/kanban";
import { store } from "../state";
import { kanbanEvents } from "../events";
import type { KanbanRepository } from "./kanban.types";

function sanitizeTicketUpdate(updates: KanbanUpdateTicketInput) {
  return {
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.description !== undefined ? { description: updates.description } : {}),
    ...(updates.assigneeIds !== undefined ? { assigneeIds: updates.assigneeIds } : {}),
    ...(updates.labelIds !== undefined ? { labelIds: updates.labelIds } : {}),
    ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
    ...(updates.estimate !== undefined ? { estimate: updates.estimate ?? undefined } : {}),
    ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
    ...(updates.sprintId !== undefined ? { sprintId: updates.sprintId ?? undefined } : {}),
    ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate ?? undefined } : {}),
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

  async updateColumn(boardId: string, columnId: string, updates: { title: string }): Promise<KanbanColumn | null> {
    const column = store.updateColumn(boardId, columnId, updates);
    if (!column) return null;
    kanbanEvents.broadcast({ type: "column-updated", boardId, columnId });
    return column;
  }

  async deleteColumn(boardId: string, columnId: string): Promise<boolean> {
    const success = store.deleteColumn(boardId, columnId);
    if (success) {
      kanbanEvents.broadcast({ type: "column-deleted", boardId, columnId });
    }
    return success;
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
      dueDate: input.dueDate,
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

  async deleteTicket(ticketId: string): Promise<boolean> {
    const ticket = store.getTicket(ticketId);
    if (!ticket) return false;
    const boardId = ticket.boardId;
    const success = store.deleteTicket(ticketId);
    if (success) {
      kanbanEvents.broadcast({ type: "ticket-deleted", boardId, ticketId });
    }
    return success;
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

  async startTimeLog(ticketId: string, userId: string, input: KanbanCreateTimeLogInput): Promise<KanbanTimeLog | null> {
    const timeLog = store.startTimeLog(ticketId, userId, input.startedAt);
    if (!timeLog) return null;
    const ticket = store.getTicket(ticketId);
    if (ticket) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
    }
    return timeLog;
  }

  async stopTimeLog(timeLogId: string, input: KanbanStopTimeLogInput): Promise<KanbanTimeLog | null> {
    const timeLog = store.stopTimeLog(timeLogId, input.endedAt);
    if (!timeLog) return null;
    const ticket = store.getTicket(timeLog.ticketId);
    if (ticket) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
    }
    return timeLog;
  }

  async getActiveTimeLog(ticketId: string, userId: string): Promise<KanbanTimeLog | null> {
    return store.getActiveTimeLog(ticketId, userId);
  }

  async listTimeLogs(ticketId: string): Promise<KanbanTimeLog[]> {
    return store.listTimeLogs(ticketId);
  }

  async deleteTimeLog(timeLogId: string): Promise<boolean> {
    const timeLog = store.getTimeLog(timeLogId);
    if (!timeLog) return false;
    const ticket = store.getTicket(timeLog.ticketId);
    const success = store.deleteTimeLog(timeLogId);
    if (success && ticket) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
    }
    return success;
  }

  async listActivities(boardId: string, limit?: number): Promise<KanbanActivity[]> {
    return store.listActivities(boardId, limit);
  }

  async listTicketActivities(ticketId: string, limit?: number): Promise<KanbanActivity[]> {
    return store.listTicketActivities(ticketId, limit);
  }

  async createLabel(boardId: string, input: KanbanCreateLabelInput): Promise<KanbanLabel> {
    const label = store.createLabel(boardId, input.name, input.color);
    kanbanEvents.broadcast({ type: "board-snapshot", boardId });
    return label;
  }

  async updateLabel(labelId: string, input: KanbanUpdateLabelInput): Promise<KanbanLabel | null> {
    const label = store.updateLabel(labelId, input);
    if (label) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: label.boardId });
    }
    return label;
  }

  async deleteLabel(labelId: string): Promise<boolean> {
    const label = store.getLabel(labelId);
    if (!label) return false;
    const success = store.deleteLabel(labelId);
    if (success) {
      kanbanEvents.broadcast({ type: "board-snapshot", boardId: label.boardId });
    }
    return success;
  }

  async listLabels(boardId: string): Promise<KanbanLabel[]> {
    return store.listLabels(boardId);
  }

  async addAttachment(
    ticketId: string,
    userId: string,
    filename: string,
    originalFilename: string,
    mimeType: string,
    size: number,
    url: string,
  ): Promise<KanbanAttachment | null> {
    const attachment = store.addAttachment(ticketId, userId, filename, originalFilename, mimeType, size, url);
    if (attachment) {
      const ticket = store.getTicket(ticketId);
      if (ticket) {
        kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
      }
    }
    return attachment;
  }

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const attachment = store.getAttachment(attachmentId);
    if (!attachment) return false;
    const success = store.deleteAttachment(attachmentId);
    if (success) {
      const ticket = store.getTicket(attachment.ticketId);
      if (ticket) {
        kanbanEvents.broadcast({ type: "board-snapshot", boardId: ticket.boardId });
      }
    }
    return success;
  }

  async listAttachments(ticketId: string): Promise<KanbanAttachment[]> {
    return store.listAttachments(ticketId);
  }
}
