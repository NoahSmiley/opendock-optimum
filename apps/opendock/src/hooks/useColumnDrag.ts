import { useCallback, useEffect, useRef } from "react";

interface DragState { id: string; ghost: HTMLElement; ghostX: number; ghostY: number; pointerX: number; pointerY: number; width: number; moved: boolean }

interface Args {
  onDropAt: (columnId: string, beforeColumnId: string | null) => void;
}

function clearShifts() {
  document.querySelectorAll<HTMLElement>(".column-shift").forEach((n) => { n.classList.remove("column-shift"); n.style.transform = ""; });
}

function applyShift(beforeId: string | null, shiftPx: number, sourceId: string) {
  const cols = Array.from(document.querySelectorAll<HTMLElement>("[data-col]"));
  const start = beforeId ? cols.findIndex((c) => c.dataset.col === beforeId) : cols.length;
  if (start < 0) return;
  for (let i = start; i < cols.length; i++) {
    if (cols[i].dataset.col === sourceId) continue;
    cols[i].classList.add("column-shift");
    cols[i].style.transform = `translateX(${shiftPx}px)`;
  }
}

function commitDropReset(sourceId: string) {
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-col]"));
  for (const c of all) { c.style.transition = "none"; c.style.transform = ""; c.classList.remove("column-shift"); }
  document.querySelector(`[data-col="${sourceId}"]`)?.classList.remove("column-dragging-source");
  requestAnimationFrame(() => requestAnimationFrame(() => { for (const c of all) c.style.transition = ""; }));
}

export function useColumnDrag({ onDropAt }: Args) {
  const drag = useRef<DragState | null>(null);
  const dropBefore = useRef<string | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const header = e.currentTarget as HTMLElement;
    const col = header.closest("[data-col]") as HTMLElement | null; if (!col) return;
    const rect = col.getBoundingClientRect();
    drag.current = {
      id,
      ghost: col.cloneNode(true) as HTMLElement,
      ghostX: rect.left,
      ghostY: rect.top,
      pointerX: e.clientX,
      pointerY: e.clientY,
      width: rect.width,
      moved: false,
    };
    const g = drag.current.ghost;
    g.style.cssText = `position:fixed;left:0;top:0;transform:translate(${rect.left}px,${rect.top}px);width:${rect.width}px;height:${rect.height}px;pointer-events:none;z-index:9998;opacity:0.85;border:1px solid var(--a-border-strong);background:var(--a-bg);margin:0;transition:none !important;`;
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = drag.current; if (!d) return;
      const dx = e.clientX - d.pointerX;
      const dy = e.clientY - d.pointerY;
      if (!d.moved) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        d.moved = true;
        document.body.appendChild(d.ghost);
        document.querySelector(`[data-col="${d.id}"]`)?.classList.add("column-dragging-source");
        document.body.style.cursor = "grabbing";
      }
      const gx = d.ghostX + dx;
      const gy = d.ghostY + dy;
      d.ghost.style.transform = `translate(${gx}px,${gy}px)`;
      const cols = Array.from(document.querySelectorAll<HTMLElement>("[data-col]")).filter((c) => c.dataset.col !== d.id);
      const before = cols.find((c) => { const r = c.getBoundingClientRect(); return e.clientX < r.left + r.width / 2; });
      const beforeId = before?.dataset.col ?? null;
      if (dropBefore.current !== beforeId) {
        clearShifts();
        applyShift(beforeId, d.width, d.id);
        dropBefore.current = beforeId;
      }
    };
    const up = () => {
      const d = drag.current; if (!d) return;
      if (d.moved) {
        d.ghost.remove();
        document.body.style.cursor = "";
        commitDropReset(d.id);
        onDropAt(d.id, dropBefore.current);
      }
      dropBefore.current = null;
      drag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
  }, [onDropAt]);

  return { onColumnPointerDown: onPointerDown };
}
