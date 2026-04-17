import { create } from "zustand";
import type { Note } from "@/types";

interface NotesState {
  notes: Note[];
  activeId: string | null;
  search: string;
  setActive: (id: string | null) => void;
  setSearch: (q: string) => void;
  create: () => void;
  createWithTitle: (title: string) => void;
  update: (id: string, patch: Partial<Pick<Note, "title" | "content">>) => void;
  remove: (id: string) => void;
  togglePin: (id: string) => void;
  duplicate: (id: string) => void;
}

const KEY = "opendock-notes";
function load(): Note[] { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save(notes: Note[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { localStorage.setItem(KEY, JSON.stringify(notes)); saveTimer = null; }, 150);
}

function sorted(notes: Note[]) {
  return [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
}

const SEEDS: { title: string; content: string; pinned: boolean; age: number }[] = [
  { title: "Getting Started", content: "Welcome to OpenDock Notes.\n\nPlain text editor with #markdown support.\n- Pin notes to the top\n- Search across all notes\n- Tags via #hashtags\n- Auto-save", pinned: true, age: 2 * 3600_000 },
  { title: "Meeting Notes", content: "Project sync\n\n- Review Q2 roadmap\n- Discuss hiring timeline\n- Ship v0.2 by end of month\n\n#work #meeting", pinned: false, age: 5 * 3600_000 },
  { title: "Ideas", content: "Things to explore:\n\n- Self-hosted git forge\n- Desktop + mobile sync\n- Markdown preview\n\n#ideas", pinned: false, age: 2 * 86_400_000 },
];

function loadOrSeed(): Note[] {
  const existing = load();
  if (existing.length > 0) return existing;
  const now = Date.now();
  const fresh = SEEDS.map((s) => ({ id: crypto.randomUUID(), title: s.title, content: s.content, pinned: s.pinned, updatedAt: now - s.age }));
  localStorage.setItem(KEY, JSON.stringify(fresh));
  return fresh;
}

const initialNotes = sorted(loadOrSeed());

export const useNotes = create<NotesState>((set, get) => ({
  notes: initialNotes,
  activeId: initialNotes[0]?.id ?? null,
  search: "",

  setActive: (id) => set({ activeId: id }),
  setSearch: (search) => set({ search }),

  create: () => {
    const note: Note = { id: crypto.randomUUID(), title: "Untitled", content: "", pinned: false, updatedAt: Date.now() };
    const notes = sorted([note, ...get().notes]); save(notes); set({ notes, activeId: note.id });
  },
  createWithTitle: (title) => {
    const note: Note = { id: crypto.randomUUID(), title, content: "", pinned: false, updatedAt: Date.now() };
    const notes = sorted([note, ...get().notes]); save(notes); set({ notes, activeId: note.id });
  },
  update: (id, patch) => {
    const notes = sorted(get().notes.map((n) => n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n));
    save(notes); set({ notes });
  },
  remove: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    save(notes); set({ notes, activeId: get().activeId === id ? null : get().activeId });
  },
  togglePin: (id) => {
    const notes = sorted(get().notes.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n));
    save(notes); set({ notes });
  },
  duplicate: (id) => {
    const src = get().notes.find((n) => n.id === id); if (!src) return;
    const note: Note = { id: crypto.randomUUID(), title: `${src.title} (copy)`, content: src.content, pinned: false, updatedAt: Date.now() };
    const notes = sorted([note, ...get().notes]); save(notes); set({ notes, activeId: note.id });
  },
}));
