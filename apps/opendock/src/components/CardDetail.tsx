import { useEffect, useState } from "react";
import type { BoardMember, Card } from "@/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface CardDetailProps {
  card: Card;
  members: BoardMember[];
  onUpdate: (p: Partial<Pick<Card, "title" | "description">>) => void;
  onAssign: (userId: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CardDetail({ card, members, onUpdate, onAssign, onDelete, onClose }: CardDetailProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [confirming, setConfirming] = useState(false);
  const assignee = members.find((m) => m.user_id === card.assignee_id);

  const flush = () => {
    const patch: Partial<Pick<Card, "title" | "description">> = {};
    if (title !== card.title) patch.title = title;
    if (description !== card.description) patch.description = description;
    if (Object.keys(patch).length) onUpdate(patch);
  };

  const close = () => { flush(); onClose(); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !confirming) close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="card-detail">
        <div className="card-detail-top">
          <button className="card-detail-close" onClick={close} aria-label="Close">&times;</button>
          <button className="card-detail-delete" onClick={() => setConfirming(true)}>Delete</button>
        </div>
        <input className="card-detail-title" value={title} onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { if (title !== card.title) onUpdate({ title }); }} placeholder="Card title" />
        <div className="card-detail-assignee">
          <label>Assignee</label>
          <select value={card.assignee_id ?? ""} onChange={(e) => onAssign(e.target.value || null)}>
            <option value="">Unassigned</option>
            {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name || m.email}</option>)}
          </select>
          {assignee && <span className="card-detail-assignee-current">{assignee.display_name || assignee.email}</span>}
        </div>
        <textarea className="card-detail-body" value={description} onChange={(e) => setDescription(e.target.value)}
          onBlur={() => { if (description !== card.description) onUpdate({ description }); }} placeholder="Add a description..." />
        <div className="card-detail-meta">Updated {new Date(card.updated_at).toLocaleString()}</div>
      </div>
      {confirming && <ConfirmDialog title="Delete card?" message={`"${card.title}" will be permanently deleted.`}
        confirmLabel="Delete" danger onConfirm={() => { onDelete(); onClose(); }} onCancel={() => setConfirming(false)} />}
    </>
  );
}
