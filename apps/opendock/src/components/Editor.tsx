import { useNotes, extractTags } from "@/stores/notes";

export function Editor() {
  const notes = useNotes((s) => s.notes);
  const activeId = useNotes((s) => s.activeId);
  const update = useNotes((s) => s.update);
  const remove = useNotes((s) => s.remove);

  const note = notes.find((n) => n.id === activeId);
  if (!note) return <div className="empty-state">No note selected</div>;

  const tags = extractTags(note.content);
  const words = note.content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="editor-area">
      <div className="editor-header">
        <input
          value={note.title}
          onChange={(e) => update(note.id, { title: e.target.value })}
          placeholder="Untitled"
        />
        <span className="editor-meta">{words}w</span>
        {tags.length > 0 && <span className="editor-meta">{tags.join(" ")}</span>}
        <button className="btn-delete" onClick={() => remove(note.id)}>delete</button>
      </div>
      <div className="editor-body">
        <textarea
          value={note.content}
          onChange={(e) => update(note.id, { content: e.target.value })}
          placeholder="Start writing... use #tags inline"
        />
      </div>
    </div>
  );
}
