import { create } from "zustand";
import * as api from "@/api/boards";
import type { Board, BoardDetail, Card, Column } from "@/types";

interface BoardsState {
  boards: Board[];
  activeBoardId: string | null;
  detail: BoardDetail | null;
  loading: boolean;
  error: string | null;
  loadBoards: () => Promise<void>;
  loadDetail: (id: string) => Promise<void>;
  setActiveBoard: (id: string | null) => void;
  createBoard: (name: string) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  renameBoard: (id: string, name: string) => Promise<void>;
  addColumn: (title: string) => Promise<void>;
  addCard: (columnId: string, title: string) => Promise<void>;
  updateCard: (cardId: string, patch: api.CardPatch) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  reset: () => void;
}

export const useBoards = create<BoardsState>((set, get) => ({
  boards: [],
  activeBoardId: null,
  detail: null,
  loading: false,
  error: null,

  loadBoards: async () => {
    set({ loading: true, error: null });
    try { const boards = await api.fetchBoards(); set({ boards, loading: false }); }
    catch (e) { set({ loading: false, error: String(e) }); }
  },

  loadDetail: async (id) => {
    try { const detail = await api.fetchBoardDetail(id); set({ detail, activeBoardId: id }); }
    catch (e) { set({ error: String(e) }); }
  },

  setActiveBoard: (id) => { set({ activeBoardId: id, detail: null }); if (id) get().loadDetail(id); },

  createBoard: async (name) => {
    const board = await api.createBoard(name);
    set({ boards: [board, ...get().boards], activeBoardId: board.id });
    await get().loadDetail(board.id);
  },

  deleteBoard: async (id) => {
    await api.deleteBoard(id);
    set({ boards: get().boards.filter((b) => b.id !== id), activeBoardId: get().activeBoardId === id ? null : get().activeBoardId, detail: null });
  },

  renameBoard: async (id, name) => {
    const fresh = await api.updateBoard(id, { name });
    set({ boards: get().boards.map((b) => b.id === id ? fresh : b) });
    const d = get().detail; if (d && d.board.id === id) set({ detail: { ...d, board: fresh } });
  },

  addColumn: async (title) => {
    const id = get().activeBoardId; if (!id) return;
    const col = await api.createColumn(id, title);
    set({ detail: withColumn(get().detail, col) });
  },

  addCard: async (columnId, title) => {
    const id = get().activeBoardId; if (!id) return;
    const card = await api.createCard(id, columnId, title);
    set({ detail: withCard(get().detail, card) });
  },

  updateCard: async (cardId, patch) => {
    const id = get().activeBoardId; if (!id) return;
    const fresh = await api.updateCard(id, cardId, patch);
    set({ detail: replaceCard(get().detail, fresh) });
  },

  moveCard: async (cardId, toColumnId) => { await get().updateCard(cardId, { column_id: toColumnId }); },

  deleteCard: async (cardId) => {
    const id = get().activeBoardId; if (!id) return;
    await api.deleteCard(id, cardId);
    set({ detail: removeCard(get().detail, cardId) });
  },

  reset: () => set({ boards: [], activeBoardId: null, detail: null, error: null }),
}));

function withColumn(d: BoardDetail | null, c: Column): BoardDetail | null { return d ? { ...d, columns: [...d.columns, c] } : d; }
function withCard(d: BoardDetail | null, c: Card): BoardDetail | null { return d ? { ...d, cards: [...d.cards, c] } : d; }
function replaceCard(d: BoardDetail | null, c: Card): BoardDetail | null { return d ? { ...d, cards: d.cards.map((x) => x.id === c.id ? c : x) } : d; }
function removeCard(d: BoardDetail | null, id: string): BoardDetail | null { return d ? { ...d, cards: d.cards.filter((c) => c.id !== id) } : d; }
