import { getCurrentBlock, withMarkers } from "./blocks";
import { unwrapToParagraph } from "./lists";

export function indentBlock(direction: "in" | "out", root: HTMLElement) {
  const block = getCurrentBlock(root);
  if (!block || block.tagName !== "LI") return;
  const list = block.parentElement;
  if (!list) return;
  withMarkers(() => {
    if (direction === "in") {
      const prev = block.previousElementSibling;
      if (!prev || prev.tagName !== "LI") return;
      let nested = prev.querySelector<HTMLElement>(`:scope > ${list.tagName.toLowerCase()}`);
      if (!nested) {
        nested = document.createElement(list.tagName);
        if (list.classList.contains("checklist")) nested.classList.add("checklist");
        prev.appendChild(nested);
      }
      nested.appendChild(block);
      return;
    }
    const parentList = list.parentElement;
    if (!parentList || parentList.tagName !== list.tagName) {
      unwrapToParagraph(block);
      return;
    }
    const grandLi = parentList.parentElement;
    if (!grandLi || grandLi.tagName !== "LI") {
      unwrapToParagraph(block);
      return;
    }
    grandLi.parentNode?.insertBefore(block, grandLi.nextSibling);
    if (list.children.length === 0) list.remove();
  }, root);
}
