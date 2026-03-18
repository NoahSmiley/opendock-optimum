import { useState, type FormEvent } from "react";
import type { Sprint } from "@/stores/boards/types";

interface SprintPanelProps {
  sprints: Sprint[];
  onCreateSprint: (data: { name: string; goal?: string; startDate: string; endDate: string }) => void;
}

export function SprintPanel({ sprints, onCreateSprint }: SprintPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    onCreateSprint({ name: name.trim(), goal: goal.trim() || undefined, startDate, endDate });
    setName("");
    setGoal("");
    setStartDate("");
    setEndDate("");
    setShowForm(false);
  };

  return (
    <div style={{ padding: "var(--space-md) var(--space-xl)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)" }}>
        <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
          Sprints
        </h3>
        <button onClick={() => setShowForm(!showForm)} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-accent)" }}>
          {showForm ? "Cancel" : "New Sprint"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sprint name" required />
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Goal (optional)" />
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={{ flex: 1 }} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ flex: 1 }} />
          </div>
          <button type="submit" className="auth-submit" style={{ padding: "6px" }}>Create Sprint</button>
        </form>
      )}
      {sprints.map((s) => (
        <div key={s.id} style={{ padding: "var(--space-sm)", background: "var(--color-bg-secondary)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-xs)", fontSize: "var(--font-size-sm)" }}>
          <strong>{s.name}</strong>
          <span style={{ color: "var(--color-text-tertiary)", marginLeft: "var(--space-sm)" }}>{s.status}</span>
        </div>
      ))}
    </div>
  );
}
