import { useState, useEffect, useRef } from "react";

interface Props { onClose: () => void; onCreate: (title: string) => void }

export function NewNoteModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = () => { if (title.trim()) { onCreate(title.trim()); onClose(); } };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">New Note</div>
        <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..." onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onClose(); }} />
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={submit}>Create</button>
        </div>
      </div>
    </div>
  );
}
