import { useEffect } from "react";

export interface MenuItem { label: string; shortcut?: string; action: () => void; danger?: boolean; divider?: boolean }

interface ContextMenuProps { x: number; y: number; items: MenuItem[]; onClose: () => void }

const CLOSE_EVENT = "opendock:close-context-menus";

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  useEffect(() => {
    window.dispatchEvent(new Event(CLOSE_EVENT));
    const onClick = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onExternal = () => onClose();
    document.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener(CLOSE_EVENT, onExternal);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(CLOSE_EVENT, onExternal);
    };
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
