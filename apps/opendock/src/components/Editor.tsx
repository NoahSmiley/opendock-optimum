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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<number | null>(null);

  const note = notes.find((n) => n.id === activeId);

  const save = useCallback(() => { setSaved(true); }, []);

  const onChange = useCallback((content: string) => {
    if (!note) return;
    setSaved(false);
    update(note.id, { content });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(save, 1000);
  }, [note, update, save]);

  useEffect(() => { setSaved(true); }, [activeId]);

  const insertAtCursor = useCallback((text: string) => {
    const el = textareaRef.current;
    if (!el || !note) return;
    const start = el.selectionStart;
    const before = el.value.substring(0, start);
    const after = el.value.substring(el.selectionEnd);
    update(note.id, { content: before + text + after });
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); });
    setSaved(false);
  }, [note, update]);

  const editorMenu: MenuItem[] = [
    { label: "Cut", shortcut: "Cmd+X", action: () => document.execCommand("cut") },
    { label: "Copy", shortcut: "Cmd+C", action: () => document.execCommand("copy") },
    { label: "Paste", shortcut: "Cmd+V", action: () => document.execCommand("paste") },
    { label: "Select all", shortcut: "Cmd+A", action: () => textareaRef.current?.select() },
    { divider: true, label: "", action: () => {} },
    { label: "Insert heading", action: () => insertAtCursor("## ") },
    { label: "Insert list", action: () => insertAtCursor("- ") },
    { label: "Insert checkbox", action: () => insertAtCursor("- [ ] ") },
    { label: "Insert code block", action: () => insertAtCursor("```\n\n```") },
    { divider: true, label: "", action: () => {} },
    { label: "Save now", shortcut: "Ctrl+S", action: save },
  ];

  if (!note) return <div className="empty-state"><span>No notes yet</span><span>Create a new note to get started</span></div>;

  const tags = extractTags(note.content);
  const words = note.content.split(/\s+/).filter(Boolean).length;

  return (
    <div className="editor-area">
      <div className="editor-header">
        <button className="back-btn" onClick={onBack}>&larr;</button>
        <input value={note.title} onChange={(e) => update(note.id, { title: e.target.value })} placeholder="Untitled" />
        {tags.map((t) => <span key={t} className="editor-tag">{t}</span>)}
        <div className="actions">
          <button onClick={() => togglePin(note.id)}>{note.pinned ? "unpin" : "pin"}</button>
          <button className="danger" onClick={() => { remove(note.id); onBack(); }}>delete</button>
        </div>
      </div>
      <div className="editor-body">
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={(e) => onChange(e.target.value)}
          onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}
          placeholder="Start writing..."
        />
      </div>
      <div className="editor-footer">
        <span>{words} words</span>
        <span>&middot;</span>
        <span className={`save-status${saved ? "" : " unsaved"}`}>{saved ? "saved" : "unsaved"}</span>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={editorMenu} onClose={() => setMenu(null)} />}
    </div>
  );
}
