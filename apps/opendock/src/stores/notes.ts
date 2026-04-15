import { create } from "zustand";

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: number;
}

export function extractTags(content: string): string[] {
  const tags = new Set<string>();
  for (const word of content.split(/\s/)) {
    if (word.startsWith("#") && word.length > 1) {
      tags.add(word.replace(/[^a-zA-Z0-9#]/g, "").toLowerCase());
    }
  }
  return [...tags].sort();
}

interface NotesState {
  notes: Note[];
  activeId: string | null;
  search: string;
  setActive: (id: string | null) => void;
  setSearch: (q: string) => void;
  create: () => void;
  update: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void;
  remove: (id: string) => void;
  togglePin: (id: string) => void;
  filtered: () => Note[];
}

const KEY = "opendock-notes";
function load(): Note[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function save(notes: Note[]) { localStorage.setItem(KEY, JSON.stringify(notes)); }

function sorted(notes: Note[]) {
  return [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: sorted(load()),
  activeId: null,
  search: "",

  setActive: (id) => set({ activeId: id }),
  setSearch: (search) => set({ search }),

  create: () => {
    const note: Note = { id: crypto.randomUUID(), title: "Untitled", content: "", pinned: false, updatedAt: Date.now() };
    const notes = sorted([note, ...get().notes]);
    save(notes);
    set({ notes, activeId: note.id });
  },

  update: (id, patch) => {
    const notes = sorted(get().notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
    save(notes);
    set({ notes });
  },

  remove: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    save(notes);
    set({ notes, activeId: get().activeId === id ? null : get().activeId });
  },

  togglePin: (id) => {
    const notes = sorted(get().notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
    save(notes);
    set({ notes });
  },

  filtered: () => {
    const { notes, search } = get();
    if (!search) return notes;
    const q = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  },
}));
