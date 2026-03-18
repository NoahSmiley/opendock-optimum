import { create } from "zustand";
import * as boardsApi from "@/lib/api/boards";
import type { Board, BoardSnapshot, Ticket } from "./types";

interface BoardsState {
  boards: Board[];
  activeBoard: BoardSnapshot | null;
  selectedTicket: Ticket | null;
  loading: boolean;
  error: string | null;
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<void>;
  selectTicket: (ticket: Ticket | null) => void;
  clearError: () => void;
  setActiveBoard: (snapshot: BoardSnapshot | null) => void;
}

export const useBoardsStore = create<BoardsState>((set) => ({
  boards: [],
  activeBoard: null,
  selectedTicket: null,
  loading: false,
  error: null,

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const { boards } = await boardsApi.fetchBoards();
      set({ boards, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load boards", loading: false });
    }
  },

  fetchBoard: async (boardId) => {
    set({ loading: true, error: null });
    try {
      const snapshot = await boardsApi.fetchBoard(boardId);
      set({ activeBoard: snapshot, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load board", loading: false });
    }
  },

  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  clearError: () => set({ error: null }),
  setActiveBoard: (snapshot) => set({ activeBoard: snapshot }),
}));
