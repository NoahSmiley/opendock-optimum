import { useEffect, useState } from "react";
import type { Card } from "@/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface CardDetailProps {
  card: Card;
  onUpdate: (p: Partial<Pick<Card, "title" | "description">>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CardDetail({ card, onUpdate, onDelete, onClose }: CardDetailProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !confirming) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirming]);

  return (
    <>
      <div className="card-detail">
        <div className="card-detail-top">
          <button className="card-detail-close" onClick={onClose} aria-label="Close">&times;</button>
          <button className="card-detail-delete" onClick={() => setConfirming(true)}>Delete</button>
        </div>
        <input className="card-detail-title" value={title} onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { if (title !== card.title) onUpdate({ title }); }} placeholder="Card title" />
        <textarea className="card-detail-body" value={description} onChange={(e) => setDescription(e.target.value)}
          onBlur={() => { if (description !== card.description) onUpdate({ description }); }} placeholder="Add a description..." />
        <div className="card-detail-meta">Updated {new Date(card.updatedAt).toLocaleString()}</div>
      </div>
      {confirming && <ConfirmDialog title="Delete card?" message={`"${card.title}" will be permanently deleted.`}
        confirmLabel="Delete" danger onConfirm={() => { onDelete(); onClose(); }} onCancel={() => setConfirming(false)} />}
    </>
  );
}
