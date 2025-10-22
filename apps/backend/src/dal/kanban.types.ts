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

export interface KanbanRepository {
  listBoards(): Promise<KanbanBoard[]>;
  boardSnapshot(boardId: string): Promise<KanbanBoardSnapshot | null>;
  listUsers(): Promise<KanbanUser[]>;

  createBoard(input: KanbanCreateBoardInput): Promise<KanbanBoardSnapshot>;
  createColumn(boardId: string, input: KanbanCreateColumnInput): Promise<KanbanColumn>;
  createSprint(boardId: string, input: KanbanCreateSprintInput): Promise<KanbanSprint>;
  createTicket(boardId: string, input: KanbanCreateTicketInput): Promise<KanbanTicket>;
  updateTicket(ticketId: string, updates: KanbanUpdateTicketInput): Promise<KanbanTicket | null>;
  updateBoard(boardId: string, input: KanbanUpdateBoardInput): Promise<KanbanBoard | null>;
  reorderTicket(boardId: string, input: KanbanReorderTicketInput): Promise<KanbanBoardSnapshot | null>;
  
  addComment(ticketId: string, userId: string, content: string): Promise<KanbanComment | null>;
  deleteComment(commentId: string): Promise<boolean>;
}
