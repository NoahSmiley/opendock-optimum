import { useNotes, extractTags } from "@/stores/notes";

export function Editor() {
  const notes = useNotes((s) => s.notes);
  const activeId = useNotes((s) => s.activeId);
  const update = useNotes((s) => s.update);
  const remove = useNotes((s) => s.remove);

  const note = notes.find((n) => n.id === activeId);
  if (!note) {
    return (
      <div className="empty-state">
        <span>No note selected</span>
        <span>Create a new note or select one from the sidebar</span>
      </div>
    );
  }

  const tags = extractTags(note.content);
  const words = note.content.split(/\s+/).filter(Boolean).length;
  const chars = note.content.length;
  const modified = new Date(note.updatedAt).toLocaleString();

  return (
    <div className="editor-area">
      <div className="editor-header">
        <input value={note.title} onChange={(e) => update(note.id, { title: e.target.value })} placeholder="Untitled" />
        {tags.map((t) => <span key={t} className="editor-tag">{t}</span>)}
        <button className="btn-icon danger" onClick={() => remove(note.id)}>delete</button>
      </div>
      <div className="editor-body">
        <textarea value={note.content} onChange={(e) => update(note.id, { content: e.target.value })} placeholder="Start writing... use #tags inline" />
      </div>
      <div className="editor-footer">
        <span>{words} words</span>
        <span>&middot;</span>
        <span>{chars} chars</span>
        <span>&middot;</span>
        <span>{modified}</span>
      </div>
    </div>
  );
}
