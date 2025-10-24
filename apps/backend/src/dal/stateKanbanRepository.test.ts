import { beforeEach, describe, expect, it } from "vitest";
import type { Response } from "express";
import { StateKanbanRepository } from "./stateKanbanRepository";
import { store } from "../state";
import { kanbanEvents } from "../events";

function createWriter() {
  const writes: string[] = [];
  const res = {
    write(chunk: string) {
      writes.push(chunk);
      return true;
    },
  } as unknown as Response;
  return { res, writes };
}

describe("StateKanbanRepository events", () => {
  const repo = new StateKanbanRepository();

  beforeEach(() => {
    store.reset();
    kanbanEvents.clearAll();
  });

  it("broadcasts ticket events", async () => {
    const board = await repo.createBoard({ name: "Board" });
    const { res, writes } = createWriter();
    const unsubscribe = kanbanEvents.subscribe(board.board.id, res);

    const column = await repo.createColumn(board.board.id, { title: "Todo" });
    expect(writes.some((entry) => entry.includes("column-created"))).toBe(true);

    const ticket = await repo.createTicket(board.board.id, { columnId: column.id, title: "Task" });
    expect(writes.some((entry) => entry.includes("ticket-created"))).toBe(true);

    const updated = await repo.updateTicket(ticket.id, { estimate: 3 });
    expect(updated?.estimate).toBe(3);
    expect(writes.some((entry) => entry.includes("ticket-updated"))).toBe(true);

    await repo.reorderTicket(board.board.id, { ticketId: ticket.id, toColumnId: column.id, toIndex: 0 });
    expect(writes.some((entry) => entry.includes("ticket-reordered"))).toBe(true);

    unsubscribe();
  });

  it("reorders tickets within the same column", async () => {
    const board = await repo.createBoard({ name: "Board" });
    const column = await repo.createColumn(board.board.id, { title: "Todo" });
    const first = await repo.createTicket(board.board.id, { columnId: column.id, title: "First" });
    const second = await repo.createTicket(board.board.id, { columnId: column.id, title: "Second" });

    const snapshot = await repo.reorderTicket(board.board.id, {
      ticketId: second.id,
      toColumnId: column.id,
      toIndex: 0,
    });

    expect(snapshot).not.toBeNull();
    if (!snapshot) return;

    const reordered = snapshot.board.tickets
      .filter((ticket) => ticket.columnId === column.id)
      .sort((a, b) => a.order - b.order);

    expect(reordered.map((ticket) => ticket.id)).toEqual([second.id, first.id]);
    expect(reordered.map((ticket) => ticket.order)).toEqual([0, 1]);
  });
});
