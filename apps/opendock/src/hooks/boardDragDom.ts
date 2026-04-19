const PLACEHOLDER_CLASS = "board-card-placeholder";

function getOrCreatePlaceholder(height: number): HTMLElement {
  let el = document.querySelector<HTMLElement>(`.${PLACEHOLDER_CLASS}`);
  if (!el) {
    el = document.createElement("div");
    el.className = PLACEHOLDER_CLASS;
  }
  el.style.height = `${height}px`;
  return el;
}

function shiftables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-card], .board-column-add-card"));
}

function snapshotPositions(): Map<HTMLElement, number> {
  const map = new Map<HTMLElement, number>();
  for (const el of shiftables()) map.set(el, el.getBoundingClientRect().top);
  return map;
}

function animateFromSnapshot(before: Map<HTMLElement, number>) {
  for (const el of shiftables()) {
    const prev = before.get(el);
    if (prev === undefined) continue;
    const next = el.getBoundingClientRect().top;
    const delta = prev - next;
    if (Math.abs(delta) < 0.5) continue;
    el.style.transition = "none";
    el.style.transform = `translateY(${delta}px)`;
  }
  requestAnimationFrame(() => {
    for (const el of shiftables()) {
      el.style.transition = "";
      el.style.transform = "";
    }
  });
}

export function hideSource(sourceId: string) {
  document.querySelector(`[data-card="${sourceId}"]`)?.classList.add("dragging-source");
}

export function moveToDropSlot(colId: string, beforeId: string | null, height: number) {
  const col = document.querySelector(`[data-col="${colId}"]`); if (!col) return;
  const body = col.querySelector<HTMLElement>(".board-column-body"); if (!body) return;
  const placeholder = getOrCreatePlaceholder(height);
  const beforeNode = beforeId
    ? body.querySelector<HTMLElement>(`[data-card="${beforeId}"]`)
    : body.querySelector<HTMLElement>(".board-column-add-card");
  if (!beforeNode) return;
  if (placeholder.parentElement === body && placeholder.nextElementSibling === beforeNode) return;
  const before = snapshotPositions();
  body.insertBefore(placeholder, beforeNode);
  animateFromSnapshot(before);
}

export function clearPlaceholder(animated = true) {
  const el = document.querySelector<HTMLElement>(`.${PLACEHOLDER_CLASS}`);
  if (!el) return;
  if (!animated) { el.remove(); return; }
  const before = snapshotPositions();
  el.remove();
  animateFromSnapshot(before);
}

export function showSource(sourceId: string) {
  document.querySelector(`[data-card="${sourceId}"]`)?.classList.remove("dragging-source");
}
