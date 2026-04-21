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

export function LinkedPanel({ anchor, label, pickKind }: LinkedPanelProps) {
  const ensure = useLinks((s) => s.ensure);
  const detach = useLinks((s) => s.detach);
  const attach = useLinks((s) => s.attach);
  const links = useLinks(useShallow(selectLinks(anchor.kind, anchor.id)));
  const [picking, setPicking] = useState(false);

  useEffect(() => { void ensure(anchor.kind, anchor.id); }, [anchor.kind, anchor.id, ensure]);

  return (
    <div className="linked-panel">
      <div className="linked-panel-head">
        <span className="linked-panel-label">{label}</span>
        <button className="linked-panel-add" onClick={() => setPicking(true)}>+ Link</button>
      </div>
      {links.length === 0 ? (
        <div className="linked-panel-empty">None linked yet.</div>
      ) : (
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
  const icon = link.kind === "note" ? "📝" : "📋";
  return (
    <li className="linked-panel-row">
      <span className="linked-panel-icon">{icon}</span>
      <span className="linked-panel-title">{link.title || "Untitled"}</span>
      {link.context && <span className="linked-panel-context">{link.context}</span>}
      <button className="linked-panel-remove" onClick={onRemove} aria-label="Remove link">&times;</button>
    </li>
  );
}
