import { useEffect, useMemo, useState } from "react";
import { useLinkCandidates, filterCandidates, type LinkCandidate } from "@/lib/linkCandidates";

export type MentionCandidate = LinkCandidate;

interface MentionPopoverProps {
  query: string;
  rect: DOMRect;
  excludeId: string | null; // id of the current note/card we're editing (never self-mention)
  onPick: (c: MentionCandidate) => void;
  onCancel: () => void;
}

export function MentionPopover({ query, rect, excludeId, onPick, onCancel }: MentionPopoverProps) {
  const candidates = useCandidates(query, excludeId);
  const [active, setActive] = useState(0);

  useEffect(() => { setActive(0); }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, candidates.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") {
        if (candidates[active]) { e.preventDefault(); onPick(candidates[active]); }
      } else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [active, candidates, onPick, onCancel]);

  if (candidates.length === 0) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: rect.left,
    top: rect.bottom + 6,
    maxHeight: 260,
  };

  return (
    <div className="mention-popover" style={style}>
      {candidates.map((c, i) => (
        <button
          key={`${c.kind}:${c.id}`}
          className={`mention-row${i === active ? " active" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); onPick(c); }}
          onMouseEnter={() => setActive(i)}
        >
          <span className="mention-kind">{c.kind === "note" ? "note" : "card"}</span>
          <span className="mention-title">{c.title || "Untitled"}</span>
          {c.context && <span className="mention-context">{c.context}</span>}
        </button>
      ))}
    </div>
  );
}

function useCandidates(query: string, excludeId: string | null): MentionCandidate[] {
  const all = useLinkCandidates();
  return useMemo(() => {
    const exclude = excludeId ? new Set([excludeId]) : undefined;
    return filterCandidates(all, { query, exclude, limit: 8 });
  }, [all, query, excludeId]);
}
