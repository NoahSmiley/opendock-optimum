import { useNotes } from "@/stores/notes";

export function Editor() {
  const notes = useNotes((s) => s.notes);
  const activeId = useNotes((s) => s.activeId);
  const update = useNotes((s) => s.update);
  const remove = useNotes((s) => s.remove);

  const note = notes.find((n) => n.id === activeId);

  if (!note) {
    return <div className="empty-state">No note selected</div>;
  }

  return (
    <div className="editor-area">
      <div className="editor-header">
        <input
          value={note.title}
          onChange={(e) => update(note.id, { title: e.target.value })}
          placeholder="Untitled"
        />
        <button className="btn-delete" onClick={() => remove(note.id)}>delete</button>
      </div>
      <div className="editor-body">
        <textarea
          value={note.content}
          onChange={(e) => update(note.id, { content: e.target.value })}
          placeholder="Start writing..."
        />
      </div>
    </div>
  );
}
