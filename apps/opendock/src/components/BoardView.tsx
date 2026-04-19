import { useCallback, useMemo, useState } from "react";
import { useBoards } from "@/stores/boards";
import type { Card } from "@/types";
import { CardDetail } from "@/components/CardDetail";
import { BoardColumn } from "@/components/BoardColumn";
import { useBoardDrag } from "@/hooks/useBoardDrag";
import { useColumnDrag } from "@/hooks/useColumnDrag";
import { useAuth } from "@/stores/auth";
import { useLiveBoard } from "@/hooks/useLiveBoard";
import { BoardMembersPanel } from "@/components/BoardMembersPanel";
import { PromptDialog } from "@/components/PromptDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";

interface ColMenu { x: number; y: number; id: string; title: string }

export function BoardView() {
  const detail = useBoards((s) => s.detail);
  const addCard = useBoards((s) => s.addCard);
  const addColumn = useBoards((s) => s.addColumn);
  const renameColumn = useBoards((s) => s.renameColumn);
  const deleteColumn = useBoards((s) => s.deleteColumn);
  const reorderColumn = useBoards((s) => s.reorderColumn);
  const reorderCard = useBoards((s) => s.reorderCard);
  const deleteCard = useBoards((s) => s.deleteCard);
  const updateCard = useBoards((s) => s.updateCard);
  const assignCard = useBoards((s) => s.assignCard);
  const currentUserId = useAuth((s) => s.data.user_id ?? null);
  useLiveBoard(detail?.board.id ?? null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showingMembers, setShowingMembers] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [colMenu, setColMenu] = useState<ColMenu | null>(null);
  const [renamingCol, setRenamingCol] = useState<ColMenu | null>(null);
  const [deletingCol, setDeletingCol] = useState<ColMenu | null>(null);

  const onDropAt = useCallback((cardId: string, colId: string, beforeId: string | null) => {
    reorderCard(cardId, colId, beforeId);
  }, [reorderCard]);

  const { onPointerDown, shouldOpenOnClick } = useBoardDrag({ onDropAt, onDragStart: () => setSelectedId(null) });
  const { onColumnPointerDown } = useColumnDrag({ onDropAt: (cid, before) => reorderColumn(cid, before) });
  const onCardOpen = useCallback((id: string) => { if (shouldOpenOnClick()) setSelectedId(id); }, [shouldOpenOnClick]);

  const cardsByColumn = useMemo(() => {
    const map = new Map<string, Card[]>();
    if (!detail) return map;
    for (const c of detail.cards) { const arr = map.get(c.column_id); if (arr) arr.push(c); else map.set(c.column_id, [c]); }
    for (const arr of map.values()) arr.sort((a, b) => a.position - b.position);
    return map;
  }, [detail]);

  if (!detail) return <div className="editor-area"><div className="empty">Select a board</div></div>;

  const selected = selectedId ? detail.cards.find((c) => c.id === selectedId) : null;
  const sortedColumns = [...detail.columns].sort((a, b) => a.position - b.position);

  const colMenuItems: MenuItem[] = colMenu ? [
    { label: "Rename", action: () => setRenamingCol(colMenu) },
    { label: "Delete", danger: true, action: () => setDeletingCol(colMenu) },
  ] : [];

  return (
    <div className="editor-area">
      <div className="board-header">
        <span className="board-header-title">{detail.board.name}</span>
        <div className="board-header-actions">
          <button className="board-header-btn" onClick={() => setShowingMembers(true)}>Share</button>
          <button className="board-header-btn" onClick={() => setAddingColumn(true)}>+ Column</button>
        </div>
      </div>
      <div className="board-columns">
        {sortedColumns.map((col) => (
          <BoardColumn key={col.id} column={col} cards={cardsByColumn.get(col.id) ?? []} members={detail.members}
            selectedId={selectedId} onCardOpen={onCardOpen} onCardPointerDown={(e, id) => onPointerDown(e, id)}
            onHeaderPointerDown={(e) => onColumnPointerDown(e, col.id)}
            onAddCard={(title) => addCard(col.id, title)} onRename={(title) => renameColumn(col.id, title)}
            onContextMenu={(e) => { e.preventDefault(); setColMenu({ x: e.clientX, y: e.clientY, id: col.id, title: col.title }); }} />
        ))}
      </div>
      {selected && <CardDetail key={selected.id} card={selected} members={detail.members}
        onUpdate={(p) => updateCard(selected.id, p)}
        onAssign={(uid) => assignCard(selected.id, uid)}
        onDelete={() => deleteCard(selected.id)} onClose={() => setSelectedId(null)} />}
      {showingMembers && <BoardMembersPanel ownerId={detail.board.owner_id} currentUserId={currentUserId} onClose={() => setShowingMembers(false)} />}
      {addingColumn && <PromptDialog title="New column" placeholder="Column title" confirmLabel="Add"
        onConfirm={(v) => { addColumn(v); setAddingColumn(false); }} onCancel={() => setAddingColumn(false)} />}
      {colMenu && <ContextMenu x={colMenu.x} y={colMenu.y} items={colMenuItems} onClose={() => setColMenu(null)} />}
      {renamingCol && <PromptDialog title="Rename column" initialValue={renamingCol.title} placeholder="Column title"
        onConfirm={(v) => { renameColumn(renamingCol.id, v); setRenamingCol(null); }} onCancel={() => setRenamingCol(null)} />}
      {deletingCol && <ConfirmDialog title="Delete column?" message={`"${deletingCol.title}" and all its cards will be permanently deleted.`}
        confirmLabel="Delete" danger onConfirm={() => { deleteColumn(deletingCol.id); setDeletingCol(null); }} onCancel={() => setDeletingCol(null)} />}
    </div>
  );
}
