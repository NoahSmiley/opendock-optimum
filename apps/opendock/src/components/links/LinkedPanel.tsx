import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { EntityKind, EntityRef, LinkedEntity } from "@/types";
import { useLinks, selectLinks } from "@/stores/links";
import { LinkPickerDialog } from "@/components/links/LinkPickerDialog";

interface LinkedPanelProps {
  anchor: EntityRef;
  label: string; // e.g. "Linked notes"
  pickKind: EntityKind; // what kind the user picks to add
}

const COLLAPSE_THRESHOLD = 3;

export function LinkedPanel({ anchor, label, pickKind }: LinkedPanelProps) {
  const ensure = useLinks((s) => s.ensure);
  const detach = useLinks((s) => s.detach);
  const attach = useLinks((s) => s.attach);
  const links = useLinks(useShallow(selectLinks(anchor.kind, anchor.id)));
  const [picking, setPicking] = useState(false);
  // Collapse by default when there are more than the threshold, per-panel state.
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = links.length > COLLAPSE_THRESHOLD && !expanded;

  useEffect(() => { void ensure(anchor.kind, anchor.id); }, [anchor.kind, anchor.id, ensure]);

  return (
    <div className="linked-panel">
      <div className="linked-panel-head">
        <button
          className="linked-panel-label-btn"
          onClick={() => setExpanded((x) => !x)}
          disabled={links.length <= COLLAPSE_THRESHOLD}
          aria-expanded={!shouldCollapse}
        >
          <span className={`linked-panel-chevron${shouldCollapse ? "" : " open"}`}>&rsaquo;</span>
          <span className="linked-panel-label">{label}</span>
          {links.length > 0 && <span className="linked-panel-count">{links.length}</span>}
        </button>
        <button className="linked-panel-add" onClick={() => setPicking(true)}>+ Link</button>
      </div>
      {links.length > 0 && !shouldCollapse && (
        <ul className="linked-panel-list">
          {links.map((l) => <LinkRow key={l.link_id} anchor={anchor} link={l} onRemove={() => detach(anchor, l)} />)}
        </ul>
      )}
      {picking && (
        <LinkPickerDialog
          anchor={anchor}
          pickKind={pickKind}
          existingIds={new Set(links.map((l) => l.id))}
          onPick={async (ref) => { await attach(anchor, ref); setPicking(false); }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function LinkRow({ anchor: _anchor, link, onRemove }: { anchor: EntityRef; link: LinkedEntity; onRemove: () => void }) {
  return (
    <li className="linked-panel-row">
      <span className="linked-panel-kind">{link.kind === "note" ? "note" : "card"}</span>
      <span className="linked-panel-title">{link.title || "Untitled"}</span>
      {link.context && <span className="linked-panel-context">{link.context}</span>}
      <button className="linked-panel-remove" onClick={onRemove} aria-label="Remove link">&times;</button>
    </li>
  );
}
