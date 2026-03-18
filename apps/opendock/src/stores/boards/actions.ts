import * as boardsApi from "@/lib/api/boards";
import { useBoardsStore } from "./store";
import type { Board, Column, Ticket, Label } from "./types";

async function refreshBoard(boardId: string) {
  const snapshot = await boardsApi.fetchBoard(boardId);
  useBoardsStore.getState().setActiveBoard(snapshot);
  return snapshot;
}

export async function createBoard(name: string, description?: string): Promise<Board> {
  const snapshot = await boardsApi.createBoard(name, description);
  await useBoardsStore.getState().fetchBoards();
  return snapshot.board;
}

export async function updateBoard(
  boardId: string,
  data: { name?: string; description?: string | null },
): Promise<Board> {
  const { board } = await boardsApi.updateBoard(boardId, data);
  await refreshBoard(boardId);
  await useBoardsStore.getState().fetchBoards();
  return board;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await boardsApi.deleteBoard(boardId);
  useBoardsStore.getState().setActiveBoard(null);
  await useBoardsStore.getState().fetchBoards();
}

export async function createColumn(boardId: string, title: string): Promise<Column> {
  const { column } = await boardsApi.createColumn(boardId, title);
  await refreshBoard(boardId);
  return column;
}

export async function deleteColumn(boardId: string, columnId: string): Promise<void> {
  await boardsApi.deleteColumn(boardId, columnId);
  await refreshBoard(boardId);
}

export async function createTicket(
  boardId: string,
  columnId: string,
  title: string,
  data?: Partial<Pick<Ticket, "description" | "priority" | "assigneeIds" | "labelIds" | "dueDate" | "sprintId">>,
): Promise<Ticket> {
  const { ticket } = await boardsApi.createTicket(boardId, { columnId, title, ...data });
  await refreshBoard(boardId);
  return ticket;
}

export async function updateTicket(
  ticketId: string,
  data: Parameters<typeof boardsApi.updateTicket>[1],
): Promise<Ticket> {
  const { ticket } = await boardsApi.updateTicket(ticketId, data);
  const board = useBoardsStore.getState().activeBoard;
  if (board) await refreshBoard(board.board.id);
  return ticket;
}

export async function deleteTicket(ticketId: string): Promise<void> {
  await boardsApi.deleteTicket(ticketId);
  const board = useBoardsStore.getState().activeBoard;
  if (board) await refreshBoard(board.board.id);
}

export async function reorderTicket(
  boardId: string,
  ticketId: string,
  toColumnId: string,
  toIndex: number,
): Promise<void> {
  // Optimistic update — move ticket locally so the UI doesn't flicker
  const board = useBoardsStore.getState().activeBoard;
  if (board) {
    const moved = board.tickets.find((t) => t.id === ticketId);
    if (moved) {
      const updated = optimisticMove(board.tickets, ticketId, moved.columnId, toColumnId, toIndex);
      useBoardsStore.getState().setActiveBoard({ ...board, tickets: updated });
    }
  }
  // Reconcile with server
  const snapshot = await boardsApi.reorderTicket(boardId, ticketId, toColumnId, toIndex);
  useBoardsStore.getState().setActiveBoard(snapshot);
}

function optimisticMove(tickets: Ticket[], id: string, fromCol: string, toCol: string, toIdx: number): Ticket[] {
  const moved = tickets.find((t) => t.id === id)!;
  // Build a map of column → sorted tickets (excluding the moved ticket)
  const cols = new Map<string, Ticket[]>();
  for (const t of tickets) {
    if (t.id === id) continue;
    const list = cols.get(t.columnId) ?? [];
    list.push(t);
    cols.set(t.columnId, list);
  }
  for (const list of cols.values()) list.sort((a, b) => a.order - b.order);
  // Insert moved ticket at destination index
  const dest = cols.get(toCol) ?? [];
  dest.splice(toIdx, 0, { ...moved, columnId: toCol });
  cols.set(toCol, dest);
  // Re-index all affected columns and flatten
  const result: Ticket[] = [];
  const affected = new Set([fromCol, toCol]);
  for (const [colId, list] of cols) {
    if (affected.has(colId)) {
      result.push(...list.map((t, i) => ({ ...t, order: i })));
    } else {
      result.push(...list);
    }
  }
  return result;
}

export async function createLabel(boardId: string, name: string, color: string): Promise<Label> {
  const { label } = await boardsApi.createLabel(boardId, name, color);
  await refreshBoard(boardId);
  return label;
}

export async function addComment(ticketId: string, content: string) {
  const { comment } = await boardsApi.addComment(ticketId, content);
  const board = useBoardsStore.getState().activeBoard;
  if (board) await refreshBoard(board.board.id);
  return comment;
}

export async function deleteComment(commentId: string) {
  await boardsApi.deleteComment(commentId);
  const board = useBoardsStore.getState().activeBoard;
  if (board) await refreshBoard(board.board.id);
}
