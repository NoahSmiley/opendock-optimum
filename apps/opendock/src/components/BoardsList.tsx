import { useState, useCallback } from "react";
import { useBoards } from "@/stores/boards";
import { ContextMenu, type MenuItem } from "@/components/ContextMenu";
import { PromptDialog } from "@/components/PromptDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface MenuState { x: number; y: number; id: string; name: string }

interface BoardsListProps { onSelect: (id: string) => void }

export function BoardsList({ onSelect }: BoardsListProps) {
  const boards = useBoards((s) => s.boards);
  const activeBoardId = useBoards((s) => s.activeBoardId);
  const createBoard = useBoards((s) => s.createBoard);
  const deleteBoard = useBoards((s) => s.deleteBoard);
  const renameBoard = useBoards((s) => s.renameBoard);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);

  const create = useCallback(() => {
    if (!name.trim()) return;
    createBoard(name.trim()); setName(""); setAdding(false);
  }, [name, createBoard]);

  const menuItems: MenuItem[] = menu ? [
    { label: "Rename", action: () => setRenaming({ id: menu.id, name: menu.name }) },
    { label: "Delete", danger: true, action: () => setDeleting({ id: menu.id, name: menu.name }) },
  ] : [];

  return (
    <div className="tool-list">
      <div className="tool-list-header">
        <div>
          <div className="tool-list-brand">OpenDock</div>
          <div className="tool-list-title">Boards</div>
        </div>
        <button className="tool-list-add" onClick={() => setAdding(true)}>+</button>
      </div>
      <div className="tool-list-items">
        {adding && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Board name"
            onKeyDown={(e) => { if (e.key === "Enter") create(); if (e.key === "Escape") setAdding(false); }}
            autoFocus className="tool-list-new-input" />
        )}
        {boards.length === 0 && !adding && <div className="empty">No boards — tap + to create one</div>}
        {boards.map((b) => (
          <div key={b.id} className={`list-item${b.id === activeBoardId ? " active" : ""}`} onClick={() => onSelect(b.id)}
            onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, id: b.id, name: b.name }); }}>
            <div className="list-item-title">{b.name}</div>
            <div className="list-item-meta"><span>{b.cards.length} cards</span><span>{b.columns.length} cols</span></div>
          </div>
        ))}
      </div>
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />}
      {renaming && <PromptDialog title="Rename board" initialValue={renaming.name} placeholder="Board name"
        onConfirm={(v) => { renameBoard(renaming.id, v); setRenaming(null); }} onCancel={() => setRenaming(null)} />}
      {deleting && <ConfirmDialog title="Delete board?" message={`"${deleting.name}" will be permanently deleted.`}
        confirmLabel="Delete" danger onConfirm={() => { deleteBoard(deleting.id); setDeleting(null); }} onCancel={() => setDeleting(null)} />}
    </div>
  );
}
