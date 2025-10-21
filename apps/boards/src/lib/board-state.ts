import type { KanbanBoard } from "@opendock/shared/types";

export function upsertBoard(list: KanbanBoard[], board: KanbanBoard): KanbanBoard[] {
  const index = list.findIndex((item) => item.id === board.id);
  if (index === -1) {
    return [...list, board];
  }
  const next = [...list];
  next[index] = board;
  return next;
}

export function sortBoards(list: KanbanBoard[]): KanbanBoard[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}
