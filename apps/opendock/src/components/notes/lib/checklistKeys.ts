import { getCurrentBlock } from "./blocks";
import { makeChecklistLi } from "./lists";

export function handleChecklistEnter(root: HTMLElement): boolean {
  const block = getCurrentBlock(root);
  if (!block?.matches("li.check-item")) return false;
  const text = block.querySelector(".check-text")?.textContent?.trim() ?? "";
  if (text === "") {
    const ul = block.parentElement;
    const p = document.createElement("p");
    p.appendChild(document.createElement("br"));
    ul?.parentNode?.insertBefore(p, ul.nextSibling);
    block.remove();
    if (ul && ul.children.length === 0) ul.remove();
    placeCursor(p, 0);
  } else {
    const newLi = makeChecklistLi("");
    block.parentNode?.insertBefore(newLi, block.nextSibling);
    const content = newLi.querySelector(".check-text");
    if (content) placeCursor(content, 0);
  }
  return true;
}

function placeCursor(node: Node, offset: number) {
  const sel = window.getSelection();
  const r = document.createRange();
  r.setStart(node, offset);
  r.collapse(true);
  sel?.removeAllRanges();
  sel?.addRange(r);
}

export function toggleCheckItem(li: HTMLElement) {
  const nowChecked = !li.classList.contains("checked");
  li.classList.toggle("checked", nowChecked);
  if (nowChecked) {
    li.classList.add("just-checked");
    setTimeout(() => li.classList.remove("just-checked"), 500);
  }
}
