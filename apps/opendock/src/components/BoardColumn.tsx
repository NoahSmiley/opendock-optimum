import { useState } from "react";
import type { Card, Column, BoardMember } from "@/types";
import { BoardCard } from "@/components/BoardCard";

interface Props {
  column: Column;
  cards: Card[];
  members: BoardMember[];
  selectedId: string | null;
  onCardOpen: (id: string) => void;
  onCardPointerDown: (e: React.PointerEvent, id: string) => void;
  onHeaderPointerDown: (e: React.PointerEvent) => void;
  onAddCard: (title: string) => void;
  onRename: (title: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function BoardColumn({ column, cards, members, selectedId, onCardOpen, onCardPointerDown, onHeaderPointerDown, onAddCard, onRename, onContextMenu }: Props) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(column.title);

  const submitAdd = () => { const t = newTitle.trim(); if (t) onAddCard(t); setNewTitle(""); setAdding(false); };
  const submitRename = () => { const t = renameValue.trim(); if (t && t !== column.title) onRename(t); setRenaming(false); };

  return (
    <div data-col={column.id} className="board-column">
      <div className="board-column-header" onContextMenu={onContextMenu} onPointerDown={(e) => { if (!renaming) onHeaderPointerDown(e); }}>
        {renaming ? (
          <input className="board-column-rename" autoFocus value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => { if (e.key === "Enter") submitRename(); if (e.key === "Escape") { setRenameValue(column.title); setRenaming(false); } }} />
        ) : (
          <span onDoubleClick={() => { setRenameValue(column.title); setRenaming(true); }}>{column.title}</span>
        )}
        <span className="board-column-count">{cards.length}</span>
      </div>
      <div className="board-column-body">
        {cards.map((card) => (
          <BoardCard key={card.id} card={card} members={members} selected={selectedId === card.id}
            onOpen={onCardOpen} onPointerDown={onCardPointerDown} />
        ))}
        {adding ? (
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Card title" autoFocus
            onBlur={submitAdd}
            onKeyDown={(e) => { if (e.key === "Enter") submitAdd(); if (e.key === "Escape") { setNewTitle(""); setAdding(false); } }}
            className="board-card-input" />
        ) : (
          <button className="board-column-add-card" onClick={() => { setNewTitle(""); setAdding(true); }} aria-label="Add card">+</button>
        )}
      </div>
    </div>
  );
}
