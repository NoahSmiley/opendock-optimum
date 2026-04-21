import { create } from "zustand";
import * as api from "@/api/links";
import type { EntityKind, EntityRef, LinkedEntity } from "@/types";
import type { LiveEvent } from "@/api/live";

type Key = string; // `${kind}:${id}`
const key = (kind: EntityKind, id: string): Key => `${kind}:${id}`;

interface LinksState {
  cache: Record<Key, LinkedEntity[] | undefined>;
  ensure: (kind: EntityKind, id: string) => Promise<void>;
  attach: (a: EntityRef, b: EntityRef) => Promise<void>;
  detach: (a: EntityRef, link: LinkedEntity) => Promise<void>;
  applyEvent: (ev: LiveEvent) => void;
  clear: () => void;
}

export const useLinks = create<LinksState>((set, get) => ({
  cache: {},
  ensure: async (kind, id) => {
    const k = key(kind, id);
    if (get().cache[k] !== undefined) return;
    try {
      const rows = await api.fetchLinks(kind, id);
      set({ cache: { ...get().cache, [k]: rows } });
    } catch (e) {
      console.warn("fetchLinks failed", e);
      set({ cache: { ...get().cache, [k]: [] } });
    }
  },
  attach: async (a, b) => {
    try {
      await api.createLink(a, b);
      // event will refresh both ends via applyEvent, but refresh now too for snappiness
      await Promise.all([invalidate(get, set, a.kind, a.id), invalidate(get, set, b.kind, b.id)]);
    } catch (e) { console.warn("attach failed", e); throw e; }
  },
  detach: async (a, link) => {
    const b: EntityRef = { kind: link.kind, id: link.id };
    try {
      await api.deleteLink(a, b);
      await Promise.all([invalidate(get, set, a.kind, a.id), invalidate(get, set, b.kind, b.id)]);
    } catch (e) { console.warn("detach failed", e); throw e; }
  },
  applyEvent: (ev) => {
    if (ev.kind !== "entity_link_changed") return;
    invalidate(get, set, ev.a_kind, ev.a_id);
    invalidate(get, set, ev.b_kind, ev.b_id);
  },
  clear: () => set({ cache: {} }),
}));

async function invalidate(
  get: () => LinksState,
  set: (p: Partial<LinksState>) => void,
  kind: EntityKind, id: string,
) {
  const k = key(kind, id);
  if (get().cache[k] === undefined) return;
  try {
    const rows = await api.fetchLinks(kind, id);
    set({ cache: { ...get().cache, [k]: rows } });
  } catch (e) { console.warn("invalidate fetchLinks", e); }
}

const EMPTY: LinkedEntity[] = [];
export const selectLinks = (kind: EntityKind, id: string) =>
  (s: LinksState) => s.cache[key(kind, id)] ?? EMPTY;
