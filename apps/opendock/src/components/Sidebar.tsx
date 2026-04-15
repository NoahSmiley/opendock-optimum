import { useNotes, extractTags } from "@/stores/notes";

export function Sidebar() {
  const activeId = useNotes((s) => s.activeId);
  const search = useNotes((s) => s.search);
  const setActive = useNotes((s) => s.setActive);
  const setSearch = useNotes((s) => s.setSearch);
  const create = useNotes((s) => s.create);
  const togglePin = useNotes((s) => s.togglePin);
  const notes = useNotes((s) => s.filtered());

  return (
    <aside className="sidebar">
      <div className="sidebar-header">OpenDock</div>
      <div className="sidebar-search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
        />
      </div>
      <div className="sidebar-notes">
        {notes.map((n) => (
          <div
            key={n.id}
            className={`note-item${n.id === activeId ? " active" : ""}`}
            onClick={() => setActive(n.id)}
          >
            <span className="note-title">{n.pinned ? "* " : ""}{n.title || "Untitled"}</span>
            {extractTags(n.content).length > 0 && (
              <span className="note-tags">{extractTags(n.content).join(" ")}</span>
            )}
            <button className="btn-pin" onClick={(e) => { e.stopPropagation(); togglePin(n.id); }}>
              {n.pinned ? "unpin" : "pin"}
            </button>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <button className="btn-new" onClick={create}>New note</button>
      </div>
    </aside>
  );
}
