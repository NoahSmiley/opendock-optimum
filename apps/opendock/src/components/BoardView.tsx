import { useState } from "react";
import { useBoards, type Card } from "@/stores/boards";

export function BoardView({ onBack }: { onBack: () => void }) {
  const board = useBoards((s) => s.activeBoard());
  const addCard = useBoards((s) => s.addCard);
  const moveCard = useBoards((s) => s.moveCard);
  const deleteCard = useBoards((s) => s.deleteCard);
  const updateCard = useBoards((s) => s.updateCard);
  const [addingCol, setAddingCol] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  if (!board) return <div className="editor-area"><div className="empty">Select a board</div></div>;

  const create = (colId: string) => {
    if (!newTitle.trim()) return;
    addCard(board.id, colId, newTitle.trim()); setNewTitle(""); setAddingCol(null);
  };

  return (
    <div className="editor-area">
      <div className="editor-top">
        <button className="back-btn" onClick={onBack}>&larr;</button>
        <span style={{ font: "600 20px var(--a-font)", color: "var(--a-text-active)" }}>{board.name}</span>
      </div>
      <div className="board-columns">
        {board.columns.map((col) => {
          const cards = board.cards.filter((c) => c.columnId === col.id).sort((a, b) => a.order - b.order);
          return (
            <div key={col.id} className="board-column">
              <div className="board-column-header">
                <span>{col.title}</span>
                <span className="board-column-count">{cards.length}</span>
                <button className="board-column-add" onClick={() => { setAddingCol(col.id); setNewTitle(""); }}>+</button>
              </div>
              {addingCol === col.id && (
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Card title" autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") create(col.id); if (e.key === "Escape") setAddingCol(null); }}
                  className="board-card-input" />
              )}
              {cards.map((card) => (
                <BoardCard key={card.id} card={card} columns={board.columns}
                  onMove={(toCol) => moveCard(board.id, card.id, toCol)}
                  onDelete={() => deleteCard(board.id, card.id)}
                  onUpdate={(p) => updateCard(board.id, card.id, p)} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({ card, columns, onMove, onDelete, onUpdate }: {
  card: Card; columns: { id: string; title: string }[];
  onMove: (colId: string) => void; onDelete: () => void;
  onUpdate: (p: Partial<Pick<Card, "title" | "description">>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);

  return (
    <div className="board-card" onContextMenu={(e) => { e.preventDefault(); onDelete(); }}>
      {editing ? (
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus className="board-card-input"
          onBlur={() => { onUpdate({ title }); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onUpdate({ title }); setEditing(false); } if (e.key === "Escape") setEditing(false); }} />
      ) : (
        <div onDoubleClick={() => setEditing(true)}>
          <div className="board-card-title">{card.title}</div>
          <div className="board-card-actions">
            {columns.filter((c) => c.id !== card.columnId).map((c) => (
              <button key={c.id} onClick={() => onMove(c.id)}>&rarr; {c.title}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
