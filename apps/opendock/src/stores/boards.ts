import { create } from "zustand";

export interface Card {
  id: string;
  title: string;
  description: string;
  columnId: string;
  order: number;
  updatedAt: number;
}

export interface Column {
  id: string;
  title: string;
  order: number;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  cards: Card[];
}

interface BoardsState {
  boards: Board[];
  activeBoardId: string | null;
  setActiveBoard: (id: string | null) => void;
  createBoard: (name: string) => void;
  deleteBoard: (id: string) => void;
  addColumn: (boardId: string, title: string) => void;
  addCard: (boardId: string, columnId: string, title: string) => void;
  updateCard: (boardId: string, cardId: string, patch: Partial<Pick<Card, "title" | "description">>) => void;
  moveCard: (boardId: string, cardId: string, toColumnId: string) => void;
  deleteCard: (boardId: string, cardId: string) => void;
  activeBoard: () => Board | undefined;
}

const KEY = "opendock-boards";
function load(): Board[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function save(boards: Board[]) { localStorage.setItem(KEY, JSON.stringify(boards)); }

export const useBoards = create<BoardsState>((set, get) => ({
  boards: load(),
  activeBoardId: null,
  setActiveBoard: (id) => set({ activeBoardId: id }),

  createBoard: (name) => {
    const board: Board = {
      id: crypto.randomUUID(), name,
      columns: [
        { id: crypto.randomUUID(), title: "To Do", order: 0 },
        { id: crypto.randomUUID(), title: "In Progress", order: 1 },
        { id: crypto.randomUUID(), title: "Done", order: 2 },
      ],
      cards: [],
    };
    const boards = [board, ...get().boards];
    save(boards); set({ boards, activeBoardId: board.id });
  },

  deleteBoard: (id) => {
    const boards = get().boards.filter((b) => b.id !== id);
    save(boards); set({ boards, activeBoardId: get().activeBoardId === id ? null : get().activeBoardId });
  },

  addColumn: (boardId, title) => {
    const boards = get().boards.map((b) => b.id === boardId ? { ...b, columns: [...b.columns, { id: crypto.randomUUID(), title, order: b.columns.length }] } : b);
    save(boards); set({ boards });
  },

  addCard: (boardId, columnId, title) => {
    const boards = get().boards.map((b) => {
      if (b.id !== boardId) return b;
      const order = b.cards.filter((c) => c.columnId === columnId).length;
      return { ...b, cards: [...b.cards, { id: crypto.randomUUID(), title, description: "", columnId, order, updatedAt: Date.now() }] };
    });
    save(boards); set({ boards });
  },

  updateCard: (boardId, cardId, patch) => {
    const boards = get().boards.map((b) => b.id === boardId ? { ...b, cards: b.cards.map((c) => c.id === cardId ? { ...c, ...patch, updatedAt: Date.now() } : c) } : b);
    save(boards); set({ boards });
  },

  moveCard: (boardId, cardId, toColumnId) => {
    const boards = get().boards.map((b) => b.id === boardId ? { ...b, cards: b.cards.map((c) => c.id === cardId ? { ...c, columnId: toColumnId, updatedAt: Date.now() } : c) } : b);
    save(boards); set({ boards });
  },

  deleteCard: (boardId, cardId) => {
    const boards = get().boards.map((b) => b.id === boardId ? { ...b, cards: b.cards.filter((c) => c.id !== cardId) } : b);
    save(boards); set({ boards });
  },

  activeBoard: () => get().boards.find((b) => b.id === get().activeBoardId),
}));
