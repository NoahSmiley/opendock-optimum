import { useState, useRef, useEffect } from "react";
import { Edit2, Paperclip } from "lucide-react";
import type { Ticket, BoardMember } from "@/stores/boards/types";
import { CommentsSection } from "./CommentsSection";

interface TicketDetailContentProps {
  ticket: Ticket;
  members: BoardMember[];
  onUpdate: (updates: Partial<Ticket>) => Promise<void>;
}

export function TicketDetailContent({ ticket, members, onUpdate }: TicketDetailContentProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState(ticket.description || "");
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setEditedTitle(ticket.title); setEditedDesc(ticket.description || ""); }, [ticket]);
  useEffect(() => { if (isEditingTitle) titleRef.current?.focus(); }, [isEditingTitle]);
  useEffect(() => { if (isEditingDesc) descRef.current?.focus(); }, [isEditingDesc]);

  const saveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== ticket.title) await onUpdate({ title: editedTitle.trim() });
    setIsEditingTitle(false);
  };

  const saveDesc = async () => {
    if (editedDesc !== ticket.description) await onUpdate({ description: editedDesc.trim() });
    setIsEditingDesc(false);
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <TitleSection title={ticket.title} editedTitle={editedTitle} isEditing={isEditingTitle}
        titleRef={titleRef} onEdit={() => setIsEditingTitle(true)} onChange={setEditedTitle}
        onSave={saveTitle} onCancel={() => { setEditedTitle(ticket.title); setIsEditingTitle(false); }} />

      <DescriptionSection description={ticket.description} editedDesc={editedDesc} isEditing={isEditingDesc}
        descRef={descRef} onEdit={() => setIsEditingDesc(true)} onChange={setEditedDesc}
        onSave={saveDesc} onCancel={() => { setEditedDesc(ticket.description || ""); setIsEditingDesc(false); }} />

      {ticket.attachments && ticket.attachments.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-400">
            <Paperclip className="h-4 w-4" />Attachments ({ticket.attachments.length})
          </h3>
          <div className="space-y-2">
            {ticket.attachments.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3">
                <Paperclip className="h-4 w-4 text-neutral-400" />
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-medium text-blue-400 hover:underline">{a.originalFilename}</a>
                <span className="text-xs text-neutral-500">{(a.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CommentsSection ticketId={ticket.id} comments={ticket.comments ?? []} members={members} />
    </div>
  );
}

function TitleSection({ title, editedTitle, isEditing, titleRef, onEdit, onChange, onSave, onCancel }: {
  title: string; editedTitle: string; isEditing: boolean; titleRef: React.RefObject<HTMLInputElement | null>;
  onEdit: () => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="mb-6">
      {isEditing ? (
        <input ref={titleRef} value={editedTitle} onChange={(e) => onChange(e.target.value)}
          onBlur={onSave} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
          className="w-full border-0 border-b-2 border-blue-500 bg-transparent px-2 py-1 text-2xl font-semibold text-white outline-none" />
      ) : (
        <h1 onClick={onEdit}
          className="group relative -ml-2 cursor-text rounded px-2 py-1 text-2xl font-semibold text-white transition-colors hover:bg-neutral-800">
          {title}
          <Edit2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </h1>
      )}
    </div>
  );
}

function DescriptionSection({ description, editedDesc, isEditing, descRef, onEdit, onChange, onSave, onCancel }: {
  description?: string; editedDesc: string; isEditing: boolean; descRef: React.RefObject<HTMLTextAreaElement | null>;
  onEdit: () => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 text-sm font-semibold text-neutral-400">Description</h3>
      {isEditing ? (
        <div className="space-y-2">
          <textarea ref={descRef} value={editedDesc} onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} placeholder="Add a description..."
            className="min-h-[120px] w-full rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <div className="flex gap-2">
            <button onClick={onSave} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Save</button>
            <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-300 hover:bg-neutral-800">Cancel</button>
          </div>
        </div>
      ) : (
        <div onClick={onEdit}
          className="group relative min-h-[60px] cursor-text rounded-md border border-transparent px-4 py-3 text-sm text-neutral-300 transition-all hover:border-neutral-700 hover:bg-neutral-800/50">
          {description ? (
            <><div className="whitespace-pre-wrap">{description}</div>
              <Edit2 className="absolute right-3 top-3 h-4 w-4 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" /></>
          ) : (
            <span className="flex items-center gap-2 text-neutral-500"><Edit2 className="h-4 w-4" />Add a description...</span>
          )}
        </div>
      )}
    </div>
  );
}
