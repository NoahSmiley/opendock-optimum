import { create } from "zustand";

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  activeId: string | null;
  setActive: (id: string | null) => void;
  create: () => void;
  update: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void;
  remove: (id: string) => void;
}

const STORAGE_KEY = "opendock-notes";

function load(): Note[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function save(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: load(),
  activeId: null,

  setActive: (id) => set({ activeId: id }),

  create: () => {
    const note: Note = { id: crypto.randomUUID(), title: "Untitled", content: "", updatedAt: Date.now() };
    const notes = [note, ...get().notes];
    save(notes);
    set({ notes, activeId: note.id });
  },

  update: (id, patch) => {
    const notes = get().notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n);
    save(notes);
    set({ notes });
  },

  remove: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    save(notes);
    set({ notes, activeId: get().activeId === id ? null : get().activeId });
  },
}));
