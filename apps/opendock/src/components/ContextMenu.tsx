import { useEffect, useRef } from "react";

interface MenuItem { label: string; action: () => void; danger?: boolean }
interface ContextMenuProps { x: number; y: number; items: MenuItem[]; onClose: () => void }

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div ref={ref} className="context-menu" style={{ left: x, top: y }}>
      {items.map((item) => (
        <button key={item.label} className={item.danger ? "danger" : ""} onClick={() => { item.action(); onClose(); }}>
          {item.label}
        </button>
      ))}
    </div>
  );
}
