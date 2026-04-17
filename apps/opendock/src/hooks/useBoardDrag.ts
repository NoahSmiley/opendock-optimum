import { useCallback, useEffect, useRef } from "react";

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

  const setDropIndicator = useCallback((colId: string | null, beforeId: string | null, shiftPx: number) => {
    if (dropBefore.current === beforeId && dropCol.current === colId) return;
    document.querySelectorAll<HTMLElement>(".card-shift").forEach((n) => { n.classList.remove("card-shift"); n.style.transform = ""; });
    if (colId && beforeId) {
      const col = document.querySelector(`[data-col="${colId}"]`);
      if (col) {
        const cards = Array.from(col.querySelectorAll<HTMLElement>("[data-card]"));
        const start = cards.findIndex((c) => c.dataset.card === beforeId);
        if (start >= 0) for (let i = start; i < cards.length; i++) {
          if (cards[i].classList.contains("dragging-source")) continue;
          cards[i].classList.add("card-shift"); cards[i].style.transform = `translateY(${shiftPx}px)`;
        }
      }
    }
    dropBefore.current = beforeId;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    drag.current = { id, ghost: el.cloneNode(true) as HTMLElement, startX: e.clientX, startY: e.clientY, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top, moved: false, height: rect.height + 6 };
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
      if (col) {
        const cards = Array.from(col.querySelectorAll<HTMLElement>("[data-card]")).filter((c) => c.dataset.card !== d.id);
        const before = cards.find((c) => { const r = c.getBoundingClientRect(); return e.clientY < r.top + r.height / 2; });
        setDropIndicator(col.getAttribute("data-col"), before?.dataset.card ?? null, d.height);
      } else setDropIndicator(null, null, 0);
    };
    const up = () => {
      const d = drag.current; if (!d) return;
      if (d.moved) {
        d.ghost.remove();
        document.querySelector(`[data-card="${d.id}"]`)?.classList.remove("dragging-source");
        document.body.style.cursor = "";
        const target = dropCol.current;
        if (target) onDropAt(d.id, target, dropBefore.current);
        justDragged.current = Date.now();
      }
      setDropHighlight(null); setDropIndicator(null, null, 0);
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [onDropAt, onDragStart, setDropHighlight, setDropIndicator]);

  const shouldOpenOnClick = useCallback(() => Date.now() - justDragged.current > 100, []);

  return { onPointerDown, shouldOpenOnClick };
}
