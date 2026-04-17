import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotes } from "@/stores/notes";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { timeAgo, notePreview, wordCount, filterNotes } from "@/lib/notes";

interface MenuState { x: number; y: number; noteId: string }
interface NotesListProps { onSelect: (id: string) => void; onNew: () => void }

export function NotesList({ onSelect, onNew }: NotesListProps) {
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setSearch = useNotes((s) => s.setSearch);
  const remove = useNotes((s) => s.remove);
  const togglePin = useNotes((s) => s.togglePin);
  const duplicate = useNotes((s) => s.duplicate);
  const allNotes = useNotes((s) => s.notes);
  const notes = useMemo(() => filterNotes(allNotes, search), [allNotes, search]);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFocus = () => searchRef.current?.focus();
    window.addEventListener("opendock:focus-search", onFocus);
    return () => window.removeEventListener("opendock:focus-search", onFocus);
  }, []);

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
    { label: "Delete", action: () => setDeleting({ id: menu!.noteId, title: menuNote.title || "Untitled" }), danger: true },
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
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..." />
        </div>
      </div>
      <div className="tool-list-items">
        {notes.length === 0 && <div className="empty">No notes</div>}
        {notes.map((n) => {
          const preview = notePreview(n.content);
          return (
            <div key={n.id} className={`list-item${n.id === activeId ? " active" : ""}`} onClick={() => onSelect(n.id)} onContextMenu={(e) => onContext(e, n.id)}>
              <div className="list-item-title">
                {n.pinned && <span className="list-item-pin">&#9679;</span>}
                {n.title || "Untitled"}
              </div>
              <div className="list-item-meta"><span>{timeAgo(n.updatedAt)}</span><span>{wordCount(n.content)}w</span></div>
              {preview && <div className="list-item-preview">{preview}</div>}
            </div>
          );
        })}
      </div>
      {menu && menuNote && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
      {deleting && <ConfirmDialog title="Delete note?" message={`"${deleting.title}" will be permanently deleted.`}
        confirmLabel="Delete" danger onConfirm={() => { remove(deleting.id); setDeleting(null); }} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
