import { useState, type FormEvent } from "react";
import type { Priority } from "@/stores/boards/types";

interface TicketFormProps {
  columnId: string;
  onSubmit: (data: { columnId: string; title: string; priority: Priority; description?: string }) => void;
  onCancel: () => void;
}

export function TicketForm({ columnId, onSubmit, onCancel }: TicketFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      columnId,
      title: title.trim(),
      priority,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="ticket-form">
      <div className="ticket-form-field">
        <label htmlFor="ticket-title">Title</label>
        <input
          id="ticket-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          placeholder="Ticket title"
        />
      </div>
      <div className="ticket-form-field">
        <label htmlFor="ticket-desc">Description</label>
        <textarea
          id="ticket-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional description"
          style={{ resize: "vertical" }}
        />
      </div>
      <div className="ticket-form-field">
        <label htmlFor="ticket-priority">Priority</label>
        <select id="ticket-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: "var(--space-sm)", justifyContent: "flex-end" }}>
        <button type="button" onClick={onCancel} style={{ padding: "6px 16px", fontSize: "var(--font-size-sm)" }}>
          Cancel
        </button>
        <button type="submit" className="auth-submit" style={{ width: "auto", padding: "6px 16px" }}>
          Create Ticket
        </button>
      </div>
    </form>
  );
}
