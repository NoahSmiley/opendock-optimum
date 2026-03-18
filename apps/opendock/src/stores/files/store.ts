import { create } from "zustand";
import * as filesApi from "@/lib/api/files";
import type { FilesState } from "./types";

export const useFilesStore = create<FilesState>((set) => ({
  files: [],
  folders: [],
  currentFolderId: null,
  viewMode: "grid",
  sortBy: "date",
  isLoading: false,
  error: null,

  setCurrentFolder: (folderId) => set({ currentFolderId: folderId }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sort) => set({ sortBy: sort }),

  fetchFiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await filesApi.fetchFiles();
      set({ files: Array.isArray(result) ? result : [], isLoading: false });
    } catch (err) {
      set({ files: [], error: (err as Error).message, isLoading: false });
    }
  },

  fetchFolders: async () => {
    try {
      const result = await filesApi.fetchFolders();
      set({ folders: Array.isArray(result) ? result : [] });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
