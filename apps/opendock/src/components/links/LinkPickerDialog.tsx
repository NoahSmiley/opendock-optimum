import { useEffect, useMemo, useState } from "react";
import type { EntityKind, EntityRef } from "@/types";
import { useNotes } from "@/stores/notes";
import { useBoards } from "@/stores/boards";

interface LinkPickerDialogProps {
  anchor: EntityRef;
  pickKind: EntityKind;
  existingIds: Set<string>;
  onPick: (ref: EntityRef) => Promise<void>;
  onCancel: () => void;
}

interface PickCandidate { id: string; title: string; context?: string }

export function LinkPickerDialog({ anchor, pickKind, existingIds, onPick, onCancel }: LinkPickerDialogProps) {
  const [query, setQuery] = useState("");
  const candidates = useCandidates(pickKind, anchor, existingIds);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates.slice(0, 50);
    return candidates.filter((c) => c.title.toLowerCase().includes(q) || (c.context ?? "").toLowerCase().includes(q)).slice(0, 50);
  }, [candidates, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const label = pickKind === "note" ? "Link a note" : "Link a card";

  return (
    <div className="link-picker-backdrop" onClick={onCancel}>
      <div className="link-picker" onClick={(e) => e.stopPropagation()}>
        <div className="link-picker-title">{label}</div>
        <input
          autoFocus className="link-picker-search" placeholder="Search…"
          value={query} onChange={(e) => setQuery(e.target.value)}
        />
        <ul className="link-picker-list">
          {filtered.length === 0 && <li className="link-picker-empty">No matches.</li>}
          {filtered.map((c) => (
            <li key={c.id}>
              <button className="link-picker-row" onClick={() => onPick({ kind: pickKind, id: c.id })}>
                <span className="link-picker-row-title">{c.title || "Untitled"}</span>
                {c.context && <span className="link-picker-row-context">{c.context}</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="link-picker-actions">
          <button className="link-picker-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function useCandidates(pickKind: EntityKind, anchor: EntityRef, existingIds: Set<string>): PickCandidate[] {
  const notes = useNotes((s) => s.notes);
  const detail = useBoards((s) => s.detail);
  const boards = useBoards((s) => s.boards);
  return useMemo(() => {
    if (pickKind === "note") {
      return notes
        .filter((n) => !(anchor.kind === "note" && anchor.id === n.id))
        .filter((n) => !existingIds.has(n.id))
        .map((n) => ({ id: n.id, title: n.title || "Untitled" }));
    }
    // pickKind === "card": we only know cards for the currently-loaded board detail
    const cards = detail?.cards ?? [];
    const columns = detail?.columns ?? [];
    const boardName = detail?.board.name ?? (boards[0]?.name ?? "");
    return cards
      .filter((c) => !(anchor.kind === "card" && anchor.id === c.id))
      .filter((c) => !existingIds.has(c.id))
      .map((c) => ({ id: c.id, title: c.title, context: `${boardName} / ${columns.find((col) => col.id === c.column_id)?.title ?? ""}` }));
  }, [pickKind, notes, detail, boards, anchor.kind, anchor.id, existingIds]);
}
