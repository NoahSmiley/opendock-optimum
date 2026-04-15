import { useState, useCallback } from "react";
import { useBoards } from "@/stores/boards";

export function BoardsList({ onSelect }: { onSelect: (id: string) => void; }) {
  const boards = useBoards((s) => s.boards);
  const activeBoardId = useBoards((s) => s.activeBoardId);
  const createBoard = useBoards((s) => s.createBoard);
  const deleteBoard = useBoards((s) => s.deleteBoard);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const create = useCallback(() => {
    if (!name.trim()) return;
    createBoard(name.trim()); setName(""); setAdding(false);
  }, [name, createBoard]);

  return (
    <div className="tool-list">
      <div className="tool-list-header">
        <div>
          <div className="tool-list-brand">OpenDock</div>
          <div className="tool-list-title">Boards</div>
        </div>
        <button className="tool-list-add" onClick={() => setAdding(true)}>+</button>
      </div>
      <div className="tool-list-items" style={{ padding: "12px 12px" }}>
        {adding && (
          <div style={{ marginBottom: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Board name"
              onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setAdding(false); }}
              autoFocus style={{ width: "100%", font: "13px var(--a-font)", background: "var(--a-bg-input)", border: "none", borderRadius: 6, padding: "6px 10px", color: "var(--a-text)", outline: "none" }} />
          </div>
        )}
        {boards.length === 0 && !adding && <div className="empty">No boards</div>}
        {boards.map((b) => (
          <div key={b.id} className={`list-item${b.id === activeBoardId ? " active" : ""}`} onClick={() => onSelect(b.id)}
            onContextMenu={(e) => { e.preventDefault(); if (confirm(`Delete "${b.name}"?`)) deleteBoard(b.id); }}>
            <div className="list-item-title">{b.name}</div>
            <div className="list-item-meta"><span>{b.cards.length} cards</span><span>{b.columns.length} cols</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
