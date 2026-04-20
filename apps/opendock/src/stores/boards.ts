import { create } from "zustand";
import * as api from "@/api/boards";
import { addMember, applyBoardEvent, applyColumnReorderLocally, applyReorderLocally, removeCard, removeColumn, removeMember, replaceCard, replaceColumn, withCard, withColumn } from "@/stores/boardsHelpers";
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
  togglePinBoard: (id: string) => Promise<void>;
  addColumn: (title: string) => Promise<void>;
  renameColumn: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  reorderColumn: (columnId: string, beforeColumnId: string | null) => Promise<void>;
  addCard: (columnId: string, title: string) => Promise<void>;
  updateCard: (cardId: string, patch: api.CardPatch) => Promise<void>;
  reorderCard: (cardId: string, toColumnId: string, beforeCardId: string | null) => Promise<void>;
  assignCard: (cardId: string, assigneeId: string | null) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  addMember: (email: string) => Promise<boolean>;
  removeMember: (userId: string) => Promise<void>;
  applyEvent: (ev: LiveEvent) => void;
}

export const useBoards = create<BoardsState>((set, get) => ({
  boards: [],
  activeBoardId: null,
  detail: null,
  loading: false,
  error: null,
  loadBoards: async () => {
    set({ loading: true, error: null });
    try { set({ boards: await api.fetchBoards(), loading: false }); }
    catch (e) { set({ loading: false, error: String(e) }); }
  },
  loadDetail: async (id) => {
    try { set({ detail: await api.fetchBoardDetail(id), activeBoardId: id }); }
    catch (e) { set({ error: String(e) }); }
  },
  setActiveBoard: (id) => { set({ activeBoardId: id, detail: null }); if (id) get().loadDetail(id); },
  createBoard: async (name) => {
    const b = await api.createBoard(name);
    set({ boards: [b, ...get().boards], activeBoardId: b.id });
    await get().loadDetail(b.id);
  },
  deleteBoard: async (id) => {
    await api.deleteBoard(id);
    const active = get().activeBoardId === id ? null : get().activeBoardId;
    set({ boards: get().boards.filter((b) => b.id !== id), activeBoardId: active, detail: null });
  },
  renameBoard: async (id, name) => {
    const fresh = await api.updateBoard(id, { name }); const d = get().detail;
    set({ boards: get().boards.map((b) => b.id === id ? fresh : b), detail: d && d.board.id === id ? { ...d, board: fresh } : d });
  },
  togglePinBoard: async (id) => {
    const existing = get().boards.find((b) => b.id === id);
    if (!existing) return;
    const nextPinned = !existing.pinned;
    set({ boards: get().boards.map((b) => b.id === id ? { ...b, pinned: nextPinned } : b) });
    try {
      const fresh = await api.updateBoard(id, { pinned: nextPinned });
      const d = get().detail;
      set({
        boards: get().boards.map((b) => b.id === id ? fresh : b),
        detail: d && d.board.id === id ? { ...d, board: fresh } : d,
      });
    } catch (e) {
      set({ boards: get().boards.map((b) => b.id === id ? existing : b), error: String(e) });
    }
  },
  addColumn: async (title) => {
    const id = get().activeBoardId; if (!id) return;
    set({ detail: withColumn(get().detail, await api.createColumn(id, title)) });
  },
  renameColumn: async (columnId, title) => {
    const id = get().activeBoardId; if (!id) return;
    set({ detail: replaceColumn(get().detail, await api.updateColumn(id, columnId, { title })) });
  },
  deleteColumn: async (columnId) => {
    const id = get().activeBoardId; if (!id) return;
    await api.deleteColumn(id, columnId);
    set({ detail: removeColumn(get().detail, columnId) });
  },
  reorderColumn: async (columnId, beforeColumnId) => {
    const d = get().detail; if (!d) return;
    const applied = applyColumnReorderLocally(d, columnId, beforeColumnId); if (!applied) return;
    set({ detail: applied.detail });
    try { await api.updateColumn(d.board.id, columnId, { position: applied.position }); }
    catch (e) { set({ detail: d, error: String(e) }); }
  },
  addCard: async (columnId, title) => {
    const id = get().activeBoardId; if (!id) return;
    set({ detail: withCard(get().detail, await api.createCard(id, columnId, title)) });
  },
  updateCard: async (cardId, patch) => {
    const id = get().activeBoardId; if (!id) return;
    set({ detail: replaceCard(get().detail, await api.updateCard(id, cardId, patch)) });
  },
  reorderCard: async (cardId, toColumnId, beforeCardId) => {
    const d = get().detail; if (!d) return;
    const applied = applyReorderLocally(d, cardId, toColumnId, beforeCardId); if (!applied) return;
    set({ detail: applied.detail });
    try { await api.updateCard(d.board.id, cardId, { column_id: toColumnId, position: applied.position }); }
    catch (e) { set({ detail: d, error: String(e) }); }
  },
  assignCard: async (cardId, assigneeId) => { await get().updateCard(cardId, { assignee_id: assigneeId }); },
  deleteCard: async (cardId) => {
    const id = get().activeBoardId; if (!id) return;
    await api.deleteCard(id, cardId);
    set({ detail: removeCard(get().detail, cardId) });
  },
  addMember: async (email) => {
    const id = get().activeBoardId; if (!id) return false;
    try { return await addMember(id, email, () => get().loadDetail(id)); }
    catch (e) { set({ error: String(e) }); return false; }
  },
  removeMember: async (userId) => {
    const id = get().activeBoardId; if (!id) return;
    try { await removeMember(id, userId, () => get().loadDetail(id)); }
    catch (e) { set({ error: String(e) }); }
  },
  applyEvent: (ev) => { set({ detail: applyBoardEvent(get().detail, ev) }); },
}));
