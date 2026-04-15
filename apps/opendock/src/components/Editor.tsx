import { useState, useEffect, useRef, useCallback } from "react";
import { useNotes, extractTags } from "@/stores/notes";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";

export function Editor({ onBack }: { onBack: () => void }) {
  const notes = useNotes((s) => s.notes);
  const activeId = useNotes((s) => s.activeId);
  const update = useNotes((s) => s.update);
  const remove = useNotes((s) => s.remove);
  const togglePin = useNotes((s) => s.togglePin);
  const [saved, setSaved] = useState(true);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | null>(null);

  const note = notes.find((n) => n.id === activeId);
  const save = useCallback(() => setSaved(true), []);

  const onChange = useCallback((content: string) => {
    if (!note) return;
    setSaved(false);
    update(note.id, { content });
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(save, 1000);
  }, [note, update, save]);

  useEffect(() => { setSaved(true); }, [activeId]);

  const insert = useCallback((text: string) => {
    const el = ref.current;
    if (!el || !note) return;
    const s = el.selectionStart;
    update(note.id, { content: el.value.substring(0, s) + text + el.value.substring(el.selectionEnd) });
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + text.length; el.focus(); });
    setSaved(false);
  }, [note, update]);

  if (!note) return <div className="empty">Select a note or create one</div>;

  const tags = extractTags(note.content);
  const words = note.content.split(/\s+/).filter(Boolean).length;

  const editorMenu: MenuItem[] = [
    { label: "Insert heading", action: () => insert("## ") },
    { label: "Insert list", action: () => insert("- ") },
    { label: "Insert checkbox", action: () => insert("- [ ] ") },
    { label: "Insert code block", action: () => insert("```\n\n```") },
  ];

  return (
    <div className="editor-area">
      <div className="editor-top">
        <button className="back-btn" onClick={onBack}>&larr;</button>
        <input value={note.title} onChange={(e) => update(note.id, { title: e.target.value })} placeholder="Untitled" />
        <div className="actions">
          <button onClick={() => togglePin(note.id)}>{note.pinned ? "unpin" : "pin"}</button>
          <button className="danger" onClick={() => { remove(note.id); onBack(); }}>delete</button>
        </div>
      </div>
      {tags.length > 0 && <div className="editor-tags">{tags.map((t) => <span key={t} className="editor-tag">{t}</span>)}</div>}
      <div className="editor-body">
        <textarea ref={ref} value={note.content} onChange={(e) => onChange(e.target.value)} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }} placeholder="Start writing..." />
      </div>
      <div className="editor-footer">
        <span>{words}w</span>
        <span>&middot;</span>
        <span className={saved ? "" : "save-unsaved"}>{saved ? "saved" : "editing"}</span>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={editorMenu} onClose={() => setMenu(null)} />}
    </div>
  );
}
