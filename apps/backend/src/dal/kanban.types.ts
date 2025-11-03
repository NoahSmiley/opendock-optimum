import type {
  KanbanBoard,
  KanbanBoardSnapshot,
  KanbanColumn,
  KanbanComment,
  KanbanSprint,
  KanbanTicket,
  KanbanTimeLog,
  KanbanUser,
  KanbanLabel,
  KanbanActivity,
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

export interface KanbanRepository {
  listBoards(): Promise<KanbanBoard[]>;
  boardSnapshot(boardId: string): Promise<KanbanBoardSnapshot | null>;
  listUsers(): Promise<KanbanUser[]>;

  createBoard(input: KanbanCreateBoardInput): Promise<KanbanBoardSnapshot>;
  createColumn(boardId: string, input: KanbanCreateColumnInput): Promise<KanbanColumn>;
  updateColumn(boardId: string, columnId: string, updates: { title?: string; wipLimit?: number | null }): Promise<KanbanColumn | null>;
  deleteColumn(boardId: string, columnId: string): Promise<boolean>;
  createSprint(boardId: string, input: KanbanCreateSprintInput): Promise<KanbanSprint>;
  createTicket(boardId: string, input: KanbanCreateTicketInput): Promise<KanbanTicket>;
  updateTicket(ticketId: string, updates: KanbanUpdateTicketInput): Promise<KanbanTicket | null>;
  deleteTicket(ticketId: string): Promise<boolean>;
  updateBoard(boardId: string, input: KanbanUpdateBoardInput): Promise<KanbanBoard | null>;
  reorderTicket(boardId: string, input: KanbanReorderTicketInput): Promise<KanbanBoardSnapshot | null>;

  addComment(ticketId: string, userId: string, content: string): Promise<KanbanComment | null>;
  deleteComment(commentId: string): Promise<boolean>;

  startTimeLog(ticketId: string, userId: string, input: KanbanCreateTimeLogInput): Promise<KanbanTimeLog | null>;
  stopTimeLog(timeLogId: string, input: KanbanStopTimeLogInput): Promise<KanbanTimeLog | null>;
  getActiveTimeLog(ticketId: string, userId: string): Promise<KanbanTimeLog | null>;
  listTimeLogs(ticketId: string): Promise<KanbanTimeLog[]>;
  deleteTimeLog(timeLogId: string): Promise<boolean>;

  listActivities(boardId: string, limit?: number): Promise<KanbanActivity[]>;
  listTicketActivities(ticketId: string, limit?: number): Promise<KanbanActivity[]>;

  createLabel(boardId: string, input: KanbanCreateLabelInput): Promise<KanbanLabel>;
  updateLabel(labelId: string, input: KanbanUpdateLabelInput): Promise<KanbanLabel | null>;
  deleteLabel(labelId: string): Promise<boolean>;
  listLabels(boardId: string): Promise<KanbanLabel[]>;

  addAttachment(
    ticketId: string,
    userId: string,
    filename: string,
    originalFilename: string,
    mimeType: string,
    size: number,
    url: string,
  ): Promise<KanbanAttachment | null>;
  deleteAttachment(attachmentId: string): Promise<boolean>;
  listAttachments(ticketId: string): Promise<KanbanAttachment[]>;
}
