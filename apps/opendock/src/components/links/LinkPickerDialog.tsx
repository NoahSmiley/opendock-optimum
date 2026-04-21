import { useEffect, useMemo, useState } from "react";
import type { EntityKind, EntityRef } from "@/types";
import { useLinkCandidates, filterCandidates } from "@/lib/linkCandidates";

interface LinkPickerDialogProps {
  anchor: EntityRef;
  pickKind: EntityKind;
  existingIds: Set<string>;
  onPick: (ref: EntityRef) => Promise<void>;
  onCancel: () => void;
}

export function LinkPickerDialog({ anchor, pickKind, existingIds, onPick, onCancel }: LinkPickerDialogProps) {
  const [query, setQuery] = useState("");
  const all = useLinkCandidates();
  const filtered = useMemo(() => {
    const exclude = new Set(existingIds);
    if (anchor.kind === pickKind) exclude.add(anchor.id);
    return filterCandidates(all, { kind: pickKind, exclude, query, limit: 50 });
  }, [all, pickKind, anchor.kind, anchor.id, existingIds, query]);

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

