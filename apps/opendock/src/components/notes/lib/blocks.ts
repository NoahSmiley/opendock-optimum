const BLOCK_TAGS = /^(H1|H2|H3|H4|H5|H6|P|DIV|LI|BLOCKQUOTE)$/;

export function isBlock(n: Node | null): n is HTMLElement {
  return !!n && n.nodeType === 1 && BLOCK_TAGS.test((n as Element).tagName);
}

export function blockOf(n: Node, root: HTMLElement): HTMLElement | null {
  let cur: Node | null = n;
  while (cur && cur !== root) {
    if (isBlock(cur)) return cur as HTMLElement;
    cur = cur.parentNode;
  }
  return null;
}

function climbToBlock(start: Node, root: HTMLElement, dir: "next" | "prev"): HTMLElement | null {
  let n: Node | null = start;
  while (n && n !== root) {
    if (isBlock(n)) return n as HTMLElement;
    const parent: Node | null = n.parentNode;
    if (parent === root) {
      n = dir === "next" ? n.nextSibling : n.previousSibling;
    } else {
      n = parent;
    }
  }
  return null;
}

function allBlocks(root: HTMLElement): HTMLElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => isBlock(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
  });
  const out: HTMLElement[] = [];
  let node = walker.nextNode();
  while (node) { out.push(node as HTMLElement); node = walker.nextNode(); }
  return out;
}

export function getSelectedBlocks(root: HTMLElement): HTMLElement[] {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return [];
  const range = sel.getRangeAt(0);

  const rootRange = document.createRange();
  rootRange.selectNodeContents(root);
  const spansAll =
    range.compareBoundaryPoints(Range.START_TO_START, rootRange) <= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, rootRange) >= 0;
  if (spansAll) {
    const blocks = allBlocks(root);
    return blocks.length > 0 ? blocks : [root];
  }

  let startBlock = blockOf(range.startContainer, root);
  let endBlock = blockOf(range.endContainer, root);

  if (!startBlock) {
    let n: Node = range.startContainer;
    if (n.nodeType === 1) n = (n as Element).childNodes[range.startOffset] ?? n;
    startBlock = climbToBlock(n, root, "next");
  }
  if (!endBlock) {
    let n: Node = range.endContainer;
    if (n.nodeType === 1) n = (n as Element).childNodes[Math.max(range.endOffset - 1, 0)] ?? n;
    endBlock = climbToBlock(n, root, "prev");
  }

  if (!startBlock && !endBlock) return [root];
  if (startBlock && startBlock === endBlock) return [startBlock];
  if (!startBlock) startBlock = endBlock;
  if (!endBlock) endBlock = startBlock;

  const blocks = allBlocks(root);
  const ordered: HTMLElement[] = [];
  let seen = false;
  for (const b of blocks) {
    if (!seen && b === startBlock) seen = true;
    if (seen) ordered.push(b);
    if (b === endBlock) break;
  }
  return ordered;
}

export function getCurrentBlock(root: HTMLElement): HTMLElement | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return blockOf(sel.getRangeAt(0).startContainer, root);
}

export function withMarkers<T>(fn: () => T, root: HTMLElement): T {
  const sel = window.getSelection();
  const startMarker = document.createElement("span");
  startMarker.setAttribute("data-sel-marker", "s");
  const endMarker = document.createElement("span");
  endMarker.setAttribute("data-sel-marker", "e");
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const er = range.cloneRange(); er.collapse(false); er.insertNode(endMarker);
    const sr = range.cloneRange(); sr.collapse(true); sr.insertNode(startMarker);
  }
  const result = fn();
  const s = root.querySelector<HTMLElement>('[data-sel-marker="s"]');
  const e = root.querySelector<HTMLElement>('[data-sel-marker="e"]');
  if (s && e && sel) {
    const r = document.createRange();
    r.setStartAfter(s);
    r.setEndBefore(e);
    sel.removeAllRanges();
    sel.addRange(r);
  }
  s?.remove();
  e?.remove();
  return result;
}
