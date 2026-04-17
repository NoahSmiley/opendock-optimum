import { useEffect, useRef, useState } from "react";

interface PromptDialogProps {
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({ title, initialValue = "", placeholder, confirmLabel = "Save", onConfirm, onCancel }: PromptDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  const submit = () => { const v = value.trim(); if (v) onConfirm(v); };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal">
        <div className="modal-title">{title}</div>
        <input ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} />
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button className="primary" onClick={submit}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
