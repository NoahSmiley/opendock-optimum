import { useState, useCallback } from "react";
import { useNotes } from "@/stores/notes";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";

interface MenuState { x: number; y: number; noteId: string }

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000) return "now";
  if (d < 3600000) return `${Math.floor(d / 60000)}m`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h`;
  return `${Math.floor(d / 86400000)}d`;
}

function preview(content: string) {
  return content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 1).join("").slice(0, 80);
}

export function NotesList({ onSelect, onNew }: { onSelect: (id: string) => void; onNew: () => void }) {
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setSearch = useNotes((s) => s.setSearch);
  const remove = useNotes((s) => s.remove);
  const togglePin = useNotes((s) => s.togglePin);
  const duplicate = useNotes((s) => s.duplicate);
  const notes = useNotes((s) => s.filtered());
  const [menu, setMenu] = useState<MenuState | null>(null);

  const onContext = useCallback((e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, noteId });
  }, []);

  const menuNote = menu ? notes.find((n) => n.id === menu.noteId) : null;
  const menuItems: MenuItem[] = menuNote ? [
    { label: "Open", action: () => onSelect(menu!.noteId) },
    { label: menuNote.pinned ? "Unpin" : "Pin", action: () => togglePin(menu!.noteId) },
    { label: "Duplicate", action: () => duplicate(menu!.noteId) },
    { divider: true, label: "", action: () => {} },
    { label: "Delete", action: () => remove(menu!.noteId), danger: true },
  ] : [];

  return (
    <div className="tool-list">
      <div className="tool-list-header">
        <div>
          <div className="tool-list-brand">OpenDock</div>
          <div className="tool-list-title">Notes</div>
        </div>
        <button className="tool-list-add" onClick={onNew}>+</button>
      </div>
      <div className="tool-list-search">
        <div className="search-pill">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." />
        </div>
      </div>
      <div className="tool-list-items">
        {notes.length === 0 && <div className="empty">No notes</div>}
        {notes.map((n) => (
          <div key={n.id} className={`list-item${n.id === activeId ? " active" : ""}`} onClick={() => onSelect(n.id)} onContextMenu={(e) => onContext(e, n.id)}>
            <div className="list-item-title">
              {n.pinned && <span className="list-item-pin">&#9679;</span>}
              {n.title || "Untitled"}
            </div>
            <div className="list-item-meta">
              <span>{timeAgo(n.updatedAt)}</span>
              <span>{n.content.split(/\s+/).filter(Boolean).length}w</span>
            </div>
            {preview(n.content) && <div className="list-item-preview">{preview(n.content)}</div>}
          </div>
        ))}
      </div>
      {menu && menuNote && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </div>
  );
}
