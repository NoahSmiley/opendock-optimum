import type {
  KanbanBoard,
  KanbanBoardSnapshot,
  KanbanColumn,
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
  reorderTicket(boardId: string, input: KanbanReorderTicketInput): Promise<KanbanBoardSnapshot | null>;
}
