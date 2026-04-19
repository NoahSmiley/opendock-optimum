import { useCallback, useEffect, useRef } from "react";
import { clearPlaceholder, hideSource, moveToDropSlot, showSource } from "@/hooks/boardDragDom";

interface DragState { id: string; ghost: HTMLElement; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean; height: number }

interface UseBoardDragArgs {
  onDropAt: (cardId: string, colId: string, beforeCardId: string | null) => void;
  onDragStart?: () => void;
}

export function useBoardDrag({ onDropAt, onDragStart }: UseBoardDragArgs) {
  const drag = useRef<DragState | null>(null);
  const dropCol = useRef<string | null>(null);
  const dropBefore = useRef<string | null>(null);
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
    drag.current = { id, ghost: el.cloneNode(true) as HTMLElement, startX: e.clientX, startY: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, moved: false, height: rect.height };
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
        hideSource(d.id);
        document.body.classList.add("dragging-card");
        document.body.style.cursor = "grabbing";
      }
      d.ghost.style.left = `${e.clientX - d.offsetX}px`;
      d.ghost.style.top = `${e.clientY - d.offsetY}px`;
      const allCols = Array.from(document.querySelectorAll<HTMLElement>("[data-col]"));
      const col = allCols.find((c) => {
        const r = c.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      }) ?? null;
      const colId = col?.dataset.col ?? null;
      setDropHighlight(colId);
      if (col && colId) {
        const cards = Array.from(col.querySelectorAll<HTMLElement>("[data-card]")).filter((c) => c.dataset.card !== d.id);
        const before = cards.find((c) => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
        const beforeId = before?.dataset.card ?? null;
        dropBefore.current = beforeId;
        moveToDropSlot(colId, beforeId, d.height);
      } else {
        dropBefore.current = null;
        clearPlaceholder();
      }
    };
    const up = () => {
      const d = drag.current; if (!d) return;
      if (d.moved) {
        d.ghost.remove();
        document.body.style.cursor = "";
        document.body.classList.remove("dragging-card");
        clearPlaceholder(false);
        showSource(d.id);
        const target = dropCol.current;
        if (target) onDropAt(d.id, target, dropBefore.current);
        justDragged.current = Date.now();
        document.body.classList.add("just-dropped");
        setTimeout(() => document.body.classList.remove("just-dropped"), 300);
      }
      setDropHighlight(null);
      dropBefore.current = null;
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
