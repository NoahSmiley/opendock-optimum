import { useNotes } from "@/stores/notes";

export function Sidebar() {
  const notes = useNotes((s) => s.notes);
  const activeId = useNotes((s) => s.activeId);
  const setActive = useNotes((s) => s.setActive);
  const create = useNotes((s) => s.create);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">OpenDock</div>
      <div className="sidebar-notes">
        {notes.map((n) => (
          <div
            key={n.id}
            className={`note-item${n.id === activeId ? " active" : ""}`}
            onClick={() => setActive(n.id)}
          >
            {n.title || "Untitled"}
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="btn-new" onClick={create}>New note</button>
      </div>
    </aside>
  );
}
