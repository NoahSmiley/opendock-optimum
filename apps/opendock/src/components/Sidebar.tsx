import { useState, useCallback } from "react";
import { useNotes, extractTags } from "@/stores/notes";
import { ContextMenu } from "@/components/ContextMenu";

interface MenuState { x: number; y: number; noteId: string }

export function Sidebar() {
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setActive = useNotes((s) => s.setActive);
  const setSearch = useNotes((s) => s.setSearch);
  const create = useNotes((s) => s.create);
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

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>OpenDock</span>
        <span>{notes.length} notes</span>
      </div>
      <div className="sidebar-search">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      </div>
      <div className="sidebar-notes">
        {notes.map((n) => {
          const tags = extractTags(n.content);
          const preview = n.content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 1).join("").slice(0, 60);
          return (
            <div key={n.id} className={`note-item${n.id === activeId ? " active" : ""}`} onClick={() => setActive(n.id)} onContextMenu={(e) => onContext(e, n.id)}>
              <div className="note-title">
                {n.pinned && <span className="note-pin-icon">*</span>}
                <span className="note-title-text">{n.title || "Untitled"}</span>
              </div>
              {preview && <div className="note-preview">{preview}</div>}
              {tags.length > 0 && <div className="note-tags-line">{tags.join(" ")}</div>}
            </div>
          );
        })}
      </div>
      <div className="sidebar-status">n: new &middot; /: search</div>
      <div style={{ padding: "0 6px 6px" }}>
        <button className="btn-new" onClick={create}>New note</button>
      </div>
      {menu && menuNote && (
        <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} items={[
          { label: menuNote.pinned ? "Unpin" : "Pin to top", action: () => togglePin(menu.noteId) },
          { label: "Duplicate", action: () => duplicate(menu.noteId) },
          { label: "Delete", action: () => remove(menu.noteId), danger: true },
        ]} />
      )}
    </aside>
  );
}
