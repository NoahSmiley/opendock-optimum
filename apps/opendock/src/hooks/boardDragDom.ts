export function flipSiblingsOnCollapse(sourceId: string) {
  const source = document.querySelector(`[data-card="${sourceId}"]`) as HTMLElement | null;
  const col = source?.closest("[data-col]");
  const siblings = col ? Array.from(col.querySelectorAll<HTMLElement>("[data-card]")).filter((c) => c !== source) : [];
  const before = siblings.map((c) => ({ el: c, top: c.getBoundingClientRect().top }));
  source?.classList.add("dragging-source");
  for (const { el, top } of before) {
    const delta = top - el.getBoundingClientRect().top;
    if (delta === 0) continue;
    el.style.transition = "none";
    el.style.transform = `translateY(${delta}px)`;
  }
  requestAnimationFrame(() => {
    for (const { el } of before) { el.style.transition = ""; el.style.transform = ""; }
  });
}

export function applyShift(colId: string, beforeId: string, shiftPx: number) {
  const col = document.querySelector(`[data-col="${colId}"]`); if (!col) return;
  const cards = Array.from(col.querySelectorAll<HTMLElement>("[data-card]"));
  const start = cards.findIndex((c) => c.dataset.card === beforeId);
  if (start < 0) return;
  for (let i = start; i < cards.length; i++) {
    if (cards[i].classList.contains("dragging-source")) continue;
    cards[i].classList.add("card-shift");
    cards[i].style.transform = `translateY(${shiftPx}px)`;
  }
}

export function clearShifts() {
  document.querySelectorAll<HTMLElement>(".card-shift").forEach((n) => {
    n.classList.remove("card-shift"); n.style.transform = "";
  });
}

export function commitDropReset(sourceId: string) {
  const allCards = Array.from(document.querySelectorAll<HTMLElement>("[data-card]"));
  for (const c of allCards) { c.style.transition = "none"; c.style.transform = ""; c.classList.remove("card-shift"); }
  document.querySelector(`[data-card="${sourceId}"]`)?.classList.remove("dragging-source");
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const c of allCards) c.style.transition = "";
  }));
}
