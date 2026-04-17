import { create } from "zustand";
import type { Board, Card, Column } from "@/types";

interface BoardsState {
  boards: Board[];
  activeBoardId: string | null;
  setActiveBoard: (id: string | null) => void;
  createBoard: (name: string) => void;
  deleteBoard: (id: string) => void;
  renameBoard: (id: string, name: string) => void;
  addCard: (boardId: string, columnId: string, title: string) => void;
  updateCard: (boardId: string, cardId: string, patch: Partial<Pick<Card, "title" | "description">>) => void;
  moveCard: (boardId: string, cardId: string, toColumnId: string) => void;
  deleteCard: (boardId: string, cardId: string) => void;
}

const KEY = "opendock-boards";
function load(): Board[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save(boards: Board[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { localStorage.setItem(KEY, JSON.stringify(boards)); saveTimer = null; }, 150);
}

function seedBoards(): Board[] {
  const cols: Column[] = ["To Do", "In Progress", "Done"].map((title, i) => ({ id: crypto.randomUUID(), title, order: i }));
  const now = Date.now();
  const mk = (title: string, col: Column, order: number): Card => ({ id: crypto.randomUUID(), title, description: "", columnId: col.id, order, updatedAt: now });
  return [{ id: crypto.randomUUID(), name: "Project Alpha", columns: cols,
    cards: [mk("Design system review", cols[0], 0), mk("Set up CI pipeline", cols[0], 1), mk("Build notes feature", cols[1], 0), mk("Ship v0.1", cols[2], 0)] }];
}
function loadOrSeed(): Board[] { const x = load(); if (x.length > 0) return x; const s = seedBoards(); save(s); return s; }

function mapBoards(boards: Board[], id: string, fn: (b: Board) => Board): Board[] {
  return boards.map((b) => b.id === id ? fn(b) : b);
}

const initialBoards = loadOrSeed();

export const useBoards = create<BoardsState>((set, get) => ({
  boards: initialBoards,
  activeBoardId: initialBoards[0]?.id ?? null,
  setActiveBoard: (id) => set({ activeBoardId: id }),

  createBoard: (name) => {
    const columns: Column[] = ["To Do", "In Progress", "Done"].map((title, i) => ({ id: crypto.randomUUID(), title, order: i }));
    const board: Board = { id: crypto.randomUUID(), name, columns, cards: [] };
    const boards = [board, ...get().boards]; save(boards); set({ boards, activeBoardId: board.id });
  },
  deleteBoard: (id) => {
    const boards = get().boards.filter((b) => b.id !== id);
    save(boards); set({ boards, activeBoardId: get().activeBoardId === id ? null : get().activeBoardId });
  },
  renameBoard: (id, name) => {
    const boards = mapBoards(get().boards, id, (b) => ({ ...b, name }));
    save(boards); set({ boards });
  },

  addCard: (boardId, columnId, title) => {
    const boards = mapBoards(get().boards, boardId, (b) => ({
      ...b, cards: [...b.cards, { id: crypto.randomUUID(), title, description: "", columnId, order: b.cards.filter((c) => c.columnId === columnId).length, updatedAt: Date.now() }],
    }));
    save(boards); set({ boards });
  },
  updateCard: (boardId, cardId, patch) => {
    const boards = mapBoards(get().boards, boardId, (b) => ({ ...b, cards: b.cards.map((c) => c.id === cardId ? { ...c, ...patch, updatedAt: Date.now() } : c) }));
    save(boards); set({ boards });
  },
  moveCard: (boardId, cardId, toColumnId) => {
    const boards = mapBoards(get().boards, boardId, (b) => {
      const card = b.cards.find((c) => c.id === cardId);
      if (!card || card.columnId === toColumnId) return b;
      const nextOrder = b.cards.filter((c) => c.columnId === toColumnId).length;
      return { ...b, cards: b.cards.map((c) => c.id === cardId ? { ...c, columnId: toColumnId, order: nextOrder, updatedAt: Date.now() } : c) };
    });
    save(boards); set({ boards });
  },
  deleteCard: (boardId, cardId) => {
    const boards = mapBoards(get().boards, boardId, (b) => ({ ...b, cards: b.cards.filter((c) => c.id !== cardId) }));
    save(boards); set({ boards });
  },
}));
