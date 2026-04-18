import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotes, flushPendingNoteSave } from "@/stores/notes";
import { useAuth } from "@/stores/auth";
import { useLiveNote } from "@/hooks/useLiveNote";
import { extractTags } from "@/lib/tags";
import { wordCount } from "@/lib/notes";
import { renderMarkdown } from "@/lib/markdown";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MembersPanel } from "@/components/MembersPanel";

interface EditorProps { onBack: () => void }

export function Editor({ onBack }: EditorProps) {
  const notes = useNotes((s) => s.notes);
  const activeId = useNotes((s) => s.activeId);
  const update = useNotes((s) => s.update);
  const remove = useNotes((s) => s.remove);
  const togglePin = useNotes((s) => s.togglePin);
  const currentUserId = useAuth((s) => s.data.user_id ?? null);
  useLiveNote(activeId);
  const [saved, setSaved] = useState(true);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showingMembers, setShowingMembers] = useState(false);
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | null>(null);

  const note = notes.find((n) => n.id === activeId);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const onChange = useCallback((content: string) => {
    if (!note) return;
    setSaved(false);
    update(note.id, { content });
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaved(true), 1000);
  }, [note, update]);

  const insert = useCallback((text: string) => {
    const el = ref.current;
    if (!el || !note) return;
    const s = el.selectionStart;
    update(note.id, { content: el.value.substring(0, s) + text + el.value.substring(el.selectionEnd) });
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = s + text.length; el.focus(); });
    setSaved(false);
  }, [note, update]);

  const tags = useMemo(() => note ? extractTags(note.content) : [], [note]);
  const words = useMemo(() => note ? wordCount(note.content) : 0, [note]);

  if (!note) return <div className="editor-area"><div className="empty">Select a note or create one</div></div>;

  const editorMenu: MenuItem[] = [
    { label: "Insert heading", action: () => insert("## ") },
    { label: "Insert list", action: () => insert("- ") },
    { label: "Insert checkbox", action: () => insert("- [ ] ") },
    { label: "Insert code block", action: () => insert("```\n\n```") },
  ];

  return (
    <div className="editor-area">
      <div className="editor-top">
        <button className="back-btn" onClick={() => { flushPendingNoteSave(); onBack(); }}>&larr;</button>
        <input value={note.title} onChange={(e) => update(note.id, { title: e.target.value })} placeholder="Untitled" />
        <div className="actions">
          <button onClick={() => setPreview((p) => !p)}>{preview ? "edit" : "preview"}</button>
          <button onClick={() => setShowingMembers(true)}>share</button>
          <button onClick={() => togglePin(note.id)}>{note.pinned ? "unpin" : "pin"}</button>
          <button className="danger" onClick={() => setConfirmingDelete(true)}>delete</button>
        </div>
      </div>
      {tags.length > 0 && <div className="editor-tags">{tags.map((t) => <span key={t} className="editor-tag">{t}</span>)}</div>}
      <div className="editor-body">
        {preview
          ? <div className="editor-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }} />
          : <textarea ref={ref} value={note.content} onChange={(e) => onChange(e.target.value)} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }} placeholder="Start writing..." />}
      </div>
      <div className="editor-footer">
        <span>{words}w</span>
        <span>&middot;</span>
        <span className={saved ? "" : "save-unsaved"}>{saved ? "saved" : "editing"}</span>
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={editorMenu} onClose={() => setMenu(null)} />}
      {confirmingDelete && <ConfirmDialog title="Delete note?" message={`"${note.title || "Untitled"}" will be permanently deleted.`}
        confirmLabel="Delete" danger onConfirm={() => { remove(note.id); setConfirmingDelete(false); onBack(); }} onCancel={() => setConfirmingDelete(false)} />}
      {showingMembers && <MembersPanel noteId={note.id} ownerId={note.owner_id} currentUserId={currentUserId} onClose={() => setShowingMembers(false)} />}
    </div>
  );
}
