import { create } from "zustand";
import { apiGet } from "@/api/client";
import type { MyCard } from "@/types";

interface MyCardsState {
  cards: MyCard[];
  loaded: boolean;
  loading: boolean;
  /** Fetch once on demand; repeated calls while fresh are no-ops. */
  ensure: () => Promise<void>;
  /** Force-refetch — call after creating/renaming/deleting a card elsewhere. */
  refresh: () => Promise<void>;
  clear: () => void;
}

export const useMyCards = create<MyCardsState>((set, get) => ({
  cards: [],
  loaded: false,
  loading: false,
  ensure: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });
    try { set({ cards: await apiGet<MyCard[]>("/me/cards"), loaded: true }); }
    catch (e) { console.warn("fetchMyCards failed", e); }
    finally { set({ loading: false }); }
  },
  refresh: async () => {
    set({ loading: true });
    try { set({ cards: await apiGet<MyCard[]>("/me/cards"), loaded: true }); }
    catch (e) { console.warn("refreshMyCards failed", e); }
    finally { set({ loading: false }); }
  },
  clear: () => set({ cards: [], loaded: false }),
}));
