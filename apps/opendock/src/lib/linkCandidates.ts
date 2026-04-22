import { useEffect, useMemo } from "react";
import type { EntityKind } from "@/types";
import { useNotes } from "@/stores/notes";
import { useMyCards } from "@/stores/myCards";

export interface LinkCandidate {
  kind: EntityKind;
  id: string;
  title: string;
  context?: string;
}

/**
 * Collect pickable link candidates: notes from local store + ALL cards
 * across every board the user can see (via /me/cards). Fetches the card
 * index lazily on first use. Caller filters by kind / query / exclusion.
 */
export function useLinkCandidates(): LinkCandidate[] {
  const notes = useNotes((s) => s.notes);
  const cards = useMyCards((s) => s.cards);
  const ensureCards = useMyCards((s) => s.ensure);
  useEffect(() => { void ensureCards(); }, [ensureCards]);
  return useMemo(() => {
    const noteHits: LinkCandidate[] = notes.map((n) => ({
      kind: "note" as const, id: n.id, title: n.title || "Untitled",
    }));
    const cardHits: LinkCandidate[] = cards.map((c) => ({
      kind: "card" as const, id: c.id, title: c.title,
      context: `${c.board_name} / ${c.column_title}`,
    }));
    return [...noteHits, ...cardHits];
  }, [notes, cards]);
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
