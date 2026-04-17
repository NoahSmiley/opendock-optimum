import { useEffect } from "react";

export interface MenuItem { label: string; shortcut?: string; action: () => void; danger?: boolean; divider?: boolean }

interface ContextMenuProps { x: number; y: number; items: MenuItem[]; onClose: () => void }

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    const handle = () => onClose();
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [onClose]);

  const finalX = Math.min(x, window.innerWidth - 188);
  const finalY = Math.min(y, window.innerHeight - items.length * 32 - 8);

  return (
    <div className="context-menu" style={{ left: finalX, top: finalY }}>
      {items.map((item, i) => item.divider ? (
        <div key={i} className="context-menu-divider" />
      ) : (
        <div key={i} className={`context-menu-item${item.danger ? " danger" : ""}`} onClick={(e) => { e.stopPropagation(); item.action(); onClose(); }}>
          <span>{item.label}</span>
          {item.shortcut && <span className="context-menu-shortcut">{item.shortcut}</span>}
        </div>
      ))}
    </div>
  );
}
