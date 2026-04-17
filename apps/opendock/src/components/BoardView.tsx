import { useCallback, useMemo, useState } from "react";
import { useBoards } from "@/stores/boards";
import type { Card } from "@/types";
import { CardDetail } from "@/components/CardDetail";
import { BoardCard } from "@/components/BoardCard";
import { useBoardDrag } from "@/hooks/useBoardDrag";

interface BoardViewProps { onBack: () => void }

export function BoardView({ onBack }: BoardViewProps) {
  const detail = useBoards((s) => s.detail);
  const addCard = useBoards((s) => s.addCard);
  const moveCard = useBoards((s) => s.moveCard);
  const deleteCard = useBoards((s) => s.deleteCard);
  const updateCard = useBoards((s) => s.updateCard);
  const [addingCol, setAddingCol] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onDropAt = useCallback((cardId: string, colId: string) => {
    if (!detail) return;
    const c = detail.cards.find((x) => x.id === cardId);
    if (c && c.column_id !== colId) moveCard(cardId, colId);
  }, [detail, moveCard]);

  const { onPointerDown, shouldOpenOnClick } = useBoardDrag({ onDropAt, onDragStart: () => setSelectedId(null) });
  const onCardOpen = useCallback((id: string) => { if (shouldOpenOnClick()) setSelectedId(id); }, [shouldOpenOnClick]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, Card[]>();
    if (!detail) return map;
    for (const c of detail.cards) { const arr = map.get(c.column_id); if (arr) arr.push(c); else map.set(c.column_id, [c]); }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [detail]);

  if (!detail) return <div className="editor-area"><div className="empty">Select a board</div></div>;

  const create = (colId: string) => {
    if (!newTitle.trim()) return;
    addCard(colId, newTitle.trim()); setNewTitle(""); setAddingCol(null);
  };

  const selected = selectedId ? detail.cards.find((c) => c.id === selectedId) : null;

  return (
    <div className="editor-area">
      <div className="board-header">
        <button className="back-btn" onClick={onBack}>&larr;</button>
        <span className="board-header-title">{detail.board.name}</span>
      </div>
      <div className="board-columns">
        {detail.columns.map((col) => {
          const cards = cardsByColumn.get(col.id) ?? [];
          return (
            <div key={col.id} data-col={col.id} className="board-column">
              <div className="board-column-header">
                <span>{col.title}</span>
                <span className="board-column-count">{cards.length}</span>
                <button className="board-column-add" onClick={() => { setAddingCol(col.id); setNewTitle(""); }}>+</button>
              </div>
              <div className="board-column-body">
                {addingCol === col.id && (
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Card title" autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") create(col.id); if (e.key === "Escape") setAddingCol(null); }}
                    className="board-card-input" />
                )}
                {cards.length === 0 && addingCol !== col.id && <div className="board-empty">No cards</div>}
                {cards.map((card) => (
                  <BoardCard key={card.id} card={card} selected={selectedId === card.id}
                    onOpen={onCardOpen} onPointerDown={onPointerDown} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected && <CardDetail key={selected.id} card={selected} onUpdate={(p) => updateCard(selected.id, p)}
        onDelete={() => deleteCard(selected.id)} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
