import { create } from "zustand";
import * as api from "@/api/notes";
import type { Note } from "@/types";
import type { LiveEvent } from "@/api/live";

interface NotesState {
  notes: Note[];
  activeId: string | null;
  search: string;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  setActive: (id: string | null) => void;
  setSearch: (q: string) => void;
  createWithTitle: (title: string) => Promise<void>;
  update: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  applyEvent: (ev: LiveEvent) => void;
  reset: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedUpdate(id: string, patch: Partial<Pick<Note, "title" | "content" | "pinned">>, apply: (n: Note) => void, onError: (e: string) => void) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { const fresh = await api.updateNote(id, patch); apply(fresh); }
    catch (e) { onError(String(e)); }
  }, 250);
}

export const useNotes = create<NotesState>((set, get) => ({
  notes: [],
  activeId: null,
  search: "",
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try { const notes = await api.fetchNotes(); set({ notes, activeId: notes[0]?.id ?? null, loading: false }); }
    catch (e) { set({ loading: false, error: String(e) }); }
  },

  setActive: (id) => set({ activeId: id }),
  setSearch: (search) => set({ search }),

  createWithTitle: async (title) => {
    const note = await api.createNote({ title });
    set({ notes: [note, ...get().notes], activeId: note.id });
  },

  update: (id, patch) => new Promise<void>((resolve) => {
    set({ notes: get().notes.map((n) => n.id === id ? { ...n, ...patch } : n) });
    debouncedUpdate(id, patch,
      (fresh) => { set({ notes: get().notes.map((n) => n.id === id ? fresh : n) }); resolve(); },
      (e) => { set({ error: e }); resolve(); });
  }),

  remove: async (id) => {
    await api.deleteNote(id);
    set({ notes: get().notes.filter((n) => n.id !== id), activeId: get().activeId === id ? null : get().activeId });
  },

  togglePin: async (id) => {
    const current = get().notes.find((n) => n.id === id); if (!current) return;
    const fresh = await api.updateNote(id, { pinned: !current.pinned });
    set({ notes: get().notes.map((n) => n.id === id ? fresh : n) });
  },

  duplicate: async (id) => {
    const src = get().notes.find((n) => n.id === id); if (!src) return;
    const note = await api.createNote({ title: `${src.title} (copy)`, content: src.content });
    set({ notes: [note, ...get().notes], activeId: note.id });
  },

  applyEvent: (ev) => {
    if (ev.kind === "note_updated") {
      const { notes } = get();
      const i = notes.findIndex((n) => n.id === ev.patch.id);
      set({ notes: i >= 0 ? notes.map((n, k) => k === i ? ev.patch : n) : [ev.patch, ...notes] });
    } else if (ev.kind === "note_deleted") {
      set({
        notes: get().notes.filter((n) => n.id !== ev.note_id),
        activeId: get().activeId === ev.note_id ? null : get().activeId,
      });
    }
  },

  reset: () => set({ notes: [], activeId: null, search: "", error: null }),
}));
