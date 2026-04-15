import { useState, useCallback } from "react";
import { useNotes } from "@/stores/notes";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";

interface MenuState { x: number; y: number; noteId: string }

export function Sidebar({ onNew }: { onNew: () => void }) {
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setActive = useNotes((s) => s.setActive);
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
    { label: "Open", action: () => setActive(menu!.noteId) },
    { label: menuNote.pinned ? "Unpin" : "Pin to top", shortcut: "Ctrl+P", action: () => togglePin(menu!.noteId) },
    { divider: true, label: "", action: () => {} },
    { label: "Duplicate", action: () => duplicate(menu!.noteId) },
    { label: "Copy contents", action: () => navigator.clipboard.writeText(menuNote.content) },
    { divider: true, label: "", action: () => {} },
    { label: "Delete", action: () => remove(menu!.noteId), danger: true },
  ] : [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="title">Clip</span>
        <span className="count">{notes.length}</span>
      </div>
      <div className="sidebar-search">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      </div>
      <div className="sidebar-notes">
        {notes.map((n) => (
          <div key={n.id} className={`note-item${n.id === activeId ? " active" : ""}`} onClick={() => setActive(n.id)} onContextMenu={(e) => onContext(e, n.id)}>
            <div className="note-title">
              {n.pinned && <span className="note-pin">&#9733;</span>}
              {n.title || "Untitled"}
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button onClick={onNew}>New note</button>
      </div>
      {menu && menuNote && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
    </aside>
  );
}
