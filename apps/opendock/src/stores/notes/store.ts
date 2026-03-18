import { create } from "zustand";
import * as notesApi from "@/lib/api/notes";
import type { NotesState, Note, Collection } from "./types";

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  collections: [],
  folders: [],
  selectedNote: null,
  activeCollection: null,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await notesApi.fetchNotes();
      set({ notes: Array.isArray(result) ? result : [], isLoading: false });
    } catch (err) {
      set({ notes: [], error: (err as Error).message, isLoading: false });
    }
  },

  fetchCollections: async () => {
    try {
      const result = await notesApi.fetchCollections();
      set({ collections: Array.isArray(result) ? result : [] });
    } catch (err) {
      set({ collections: [], error: (err as Error).message });
    }
  },

  selectNote: (note: Note | null) => set({ selectedNote: note }),

  selectCollection: (collection: Collection | null) => set({ activeCollection: collection }),
}));
