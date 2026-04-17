import { useCallback, useEffect, useRef } from "react";

interface DragState { id: string; ghost: HTMLElement; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean }

interface UseBoardDragArgs {
  onDropAt: (cardId: string, colId: string) => void;
  onDragStart?: () => void;
}

export function useBoardDrag({ onDropAt, onDragStart }: UseBoardDragArgs) {
  const drag = useRef<DragState | null>(null);
  const dropCol = useRef<string | null>(null);
  const justDragged = useRef(0);

  const setDropHighlight = useCallback((colId: string | null) => {
    if (dropCol.current === colId) return;
    if (dropCol.current) document.querySelector(`[data-col="${dropCol.current}"]`)?.classList.remove("drop-target");
    if (colId) document.querySelector(`[data-col="${colId}"]`)?.classList.add("drop-target");
    dropCol.current = colId;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    drag.current = { id, ghost: el.cloneNode(true) as HTMLElement, startX: e.clientX, startY: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, moved: false };
    const g = drag.current.ghost;
    g.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;pointer-events:none;z-index:9999;opacity:0.85;border:1px solid var(--a-border-strong);`;
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current; if (!d) return;
      if (!d.moved) {
        if (Math.abs(e.clientX - d.startX) < 4 && Math.abs(e.clientY - d.startY) < 4) return;
        d.moved = true;
        onDragStart?.();
        document.body.appendChild(d.ghost);
        document.querySelector(`[data-card="${d.id}"]`)?.classList.add("dragging-source");
        document.body.style.cursor = "grabbing";
      }
      d.ghost.style.left = `${e.clientX - d.offsetX}px`;
      d.ghost.style.top = `${e.clientY - d.offsetY}px`;
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const col = under?.closest("[data-col]") as HTMLElement | null;
      setDropHighlight(col?.dataset.col ?? null);
    };
    const up = () => {
      const d = drag.current; if (!d) return;
      if (d.moved) {
        d.ghost.remove();
        document.querySelector(`[data-card="${d.id}"]`)?.classList.remove("dragging-source");
        document.body.style.cursor = "";
        const target = dropCol.current;
        if (target) onDropAt(d.id, target);
        justDragged.current = Date.now();
      }
      setDropHighlight(null);
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [onDropAt, onDragStart, setDropHighlight]);

  const shouldOpenOnClick = useCallback(() => Date.now() - justDragged.current > 100, []);

  return { onPointerDown, shouldOpenOnClick };
}
