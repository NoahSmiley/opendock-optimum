import { describe, expect, it } from "vitest";
import type { KanbanBoard } from "@opendock/shared/types";
import { sortBoards, upsertBoard } from "./board-state";

const makeBoard = (id: string, name: string): KanbanBoard => ({
  id,
  name,
  description: undefined,
  projectId: undefined,
  createdAt: new Date().toISOString(),
  memberIds: [],
  members: [],
  columns: [],
  tickets: [],
  sprints: [],
  epics: [],
  labels: [],
});

describe("board-state helpers", () => {
  it("appends missing board", () => {
    const boards: KanbanBoard[] = [makeBoard("1", "Alpha")];
    const result = upsertBoard(boards, makeBoard("2", "Beta"));
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe("2");
    expect(boards).toHaveLength(1); // ensure immutability
  });

  it("replaces existing board", () => {
    const original = makeBoard("1", "Alpha");
    const boards: KanbanBoard[] = [original];
    const updated = { ...original, name: "Alpha Prime" };
    const result = upsertBoard(boards, updated);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alpha Prime");
    expect(result[0]).not.toBe(original);
  });

  it("sorts boards by name", () => {
    const boards = [makeBoard("2", "Zeta"), makeBoard("1", "Alpha")];
    const sorted = sortBoards(boards);
    expect(sorted.map((board) => board.id)).toEqual(["1", "2"]);
  });
});
