import { getSelectedBlocks, withMarkers } from "./blocks";

export type ListType = "ul" | "ol" | "checklist";

export function blockListType(block: HTMLElement): ListType | null {
  if (block.tagName !== "LI") return null;
  const parent = block.parentElement;
  if (!parent) return null;
  if (parent.tagName === "UL" && parent.classList.contains("checklist")) return "checklist";
  if (parent.tagName === "UL") return "ul";
  if (parent.tagName === "OL") return "ol";
  return null;
}

function extractText(block: HTMLElement): string {
  const clone = block.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(".check-box").forEach((el) => el.remove());
  const textSpans = clone.querySelectorAll(".check-text");
  if (textSpans.length > 0) {
    const deepest = textSpans[textSpans.length - 1] as HTMLElement;
    return deepest.innerHTML;
  }
  clone.querySelectorAll("ul, ol").forEach((el) => el.remove());
  return clone.innerHTML.replace(/^\s+|\s+$/g, "");
}

export function unwrapToParagraph(block: HTMLElement): HTMLElement {
  const list = block.parentElement;
  const replacement = document.createElement("p");
  replacement.innerHTML = extractText(block) || "<br>";
  if (block.tagName === "LI" && list) {
    list.parentNode?.insertBefore(replacement, list);
    block.remove();
    if (list.children.length === 0) list.remove();
  } else {
    block.parentNode?.replaceChild(replacement, block);
  }
  return replacement;
}

export function makeChecklistLi(html: string): HTMLElement {
  const li = document.createElement("li");
  li.className = "check-item";
  const box = document.createElement("span");
  box.className = "check-box";
  box.setAttribute("contenteditable", "false");
  li.appendChild(box);
  li.appendChild(document.createTextNode(" "));
  const content = document.createElement("span");
  content.className = "check-text";
  content.innerHTML = html || "<br>";
  li.appendChild(content);
  return li;
}

function makePlainLi(html: string): HTMLElement {
  const li = document.createElement("li");
  li.innerHTML = html || "<br>";
  return li;
}

function splitRootBrSeparated(root: HTMLElement): HTMLElement[] {
  const isEmpty = (root.textContent ?? "").trim().length === 0;
  if (isEmpty) {
    root.innerHTML = "";
    const p = document.createElement("p");
    p.appendChild(document.createElement("br"));
    root.appendChild(p);
    return [p];
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let buffer = "";
  let node = walker.nextNode();
  while (node) {
    buffer += node.textContent ?? "";
    node = walker.nextNode();
  }
  const lines = buffer.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) lines.push("");
  root.innerHTML = "";
  const ps: HTMLElement[] = [];
  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = line;
    if (!p.firstChild) p.appendChild(document.createElement("br"));
    root.appendChild(p);
    ps.push(p);
  }
  return ps;
}

export function toggleListType(target: ListType, root: HTMLElement) {
  const initial = getSelectedBlocks(root);
  if (initial.length === 0) return;
  withMarkers(() => {
    const blocks = initial.length === 1 && initial[0] === root
      ? splitRootBrSeparated(root)
      : initial;
    if (blocks.length === 0) return;
    const allTarget = blocks.every((b) => blockListType(b) === target);
    const contents = blocks.map((b) => extractText(b));
    const firstBlock = blocks[0];
    const anchor = firstBlock.tagName === "LI" ? firstBlock.parentElement : firstBlock;
    if (!anchor || !anchor.parentNode) return;
    const anchorParent = anchor.parentNode;

    const replacement: HTMLElement[] = [];
    if (allTarget) {
      for (const html of contents) {
        const p = document.createElement("p");
        p.innerHTML = html || "<br>";
        replacement.push(p);
      }
    } else {
      const list = document.createElement(target === "ol" ? "ol" : "ul");
      if (target === "checklist") list.className = "checklist";
      for (const html of contents) {
        list.appendChild(target === "checklist" ? makeChecklistLi(html) : makePlainLi(html));
      }
      replacement.push(list);
    }

    for (const node of replacement) anchorParent.insertBefore(node, anchor);
    const oldLists = new Set<HTMLElement>();
    for (const b of blocks) {
      if (b === root) continue;
      if (b.tagName === "LI" && b.parentElement) oldLists.add(b.parentElement);
      b.remove();
    }
    for (const list of oldLists) {
      if (list.children.length === 0) list.remove();
    }

    const firstReplacement = replacement[0];
    const cursorTarget = firstReplacement.querySelector<HTMLElement>(".check-text") ?? firstReplacement;
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNodeContents(cursorTarget);
    r.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(r);
  }, root);
}
