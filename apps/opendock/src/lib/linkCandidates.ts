import { useMemo } from "react";
import type { EntityKind } from "@/types";
import { useNotes } from "@/stores/notes";
import { useBoards } from "@/stores/boards";

export interface LinkCandidate {
  kind: EntityKind;
  id: string;
  title: string;
  context?: string;
}

/**
 * Collect pickable link candidates (notes from local store + cards from the
 * currently-loaded board detail). The caller filters by kind / query /
 * exclusion as needed — this hook just assembles the raw list.
 */
export function useLinkCandidates(): LinkCandidate[] {
  const notes = useNotes((s) => s.notes);
  const detail = useBoards((s) => s.detail);
  return useMemo(() => {
    const noteHits: LinkCandidate[] = notes.map((n) => ({
      kind: "note" as const, id: n.id, title: n.title || "Untitled",
    }));
    const cards = detail?.cards ?? [];
    const columns = detail?.columns ?? [];
    const boardName = detail?.board.name ?? "";
    const cardHits: LinkCandidate[] = cards.map((c) => ({
      kind: "card" as const, id: c.id, title: c.title,
      context: `${boardName} / ${columns.find((col) => col.id === c.column_id)?.title ?? ""}`,
    }));
    return [...noteHits, ...cardHits];
  }, [notes, detail]);
}

export function filterCandidates(
  all: LinkCandidate[],
  opts: { kind?: EntityKind; exclude?: Set<string>; query?: string; limit?: number },
): LinkCandidate[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const out = all.filter((c) => {
    if (opts.kind && c.kind !== opts.kind) return false;
    if (opts.exclude?.has(c.id)) return false;
    if (!q) return true;
    return c.title.toLowerCase().includes(q) || (c.context ?? "").toLowerCase().includes(q);
  });
  return opts.limit ? out.slice(0, opts.limit) : out;
}
