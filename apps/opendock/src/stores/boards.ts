import { create } from "zustand";
import * as api from "@/api/boards";
import { applyBoardEvent, removeCard, replaceCard, withCard, withColumn } from "@/stores/boardsHelpers";
import type { Board, BoardDetail } from "@/types";
import type { LiveEvent } from "@/api/live";

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
  assignCard: (cardId: string, assigneeId: string | null) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  addMember: (email: string) => Promise<boolean>;
  removeMember: (userId: string) => Promise<void>;
  applyEvent: (ev: LiveEvent) => void;
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
  moveCard: async (cardId, toColumnId) => {
    const d = get().detail; if (!d) return;
    const card = d.cards.find((c) => c.id === cardId); if (!card || card.column_id === toColumnId) return;
    const optimistic = { ...card, column_id: toColumnId };
    set({ detail: replaceCard(d, optimistic) });
    try { await get().updateCard(cardId, { column_id: toColumnId }); }
    catch (e) { set({ detail: replaceCard(get().detail, card), error: String(e) }); }
  },
  assignCard: async (cardId, assigneeId) => { await get().updateCard(cardId, { assignee_id: assigneeId }); },
  addMember: async (email) => {
    const id = get().activeBoardId; if (!id) return false;
    try { await api.addBoardMember(id, email); await get().loadDetail(id); return true; }
    catch (e) { set({ error: String(e) }); return false; }
  },
  removeMember: async (userId) => {
    const id = get().activeBoardId; if (!id) return;
    try { await api.removeBoardMember(id, userId); await get().loadDetail(id); }
    catch (e) { set({ error: String(e) }); }
  },
  deleteCard: async (cardId) => {
    const id = get().activeBoardId; if (!id) return;
    await api.deleteCard(id, cardId);
    set({ detail: removeCard(get().detail, cardId) });
  },
  applyEvent: (ev) => { set({ detail: applyBoardEvent(get().detail, ev) }); },
  reset: () => set({ boards: [], activeBoardId: null, detail: null, error: null }),
}));
