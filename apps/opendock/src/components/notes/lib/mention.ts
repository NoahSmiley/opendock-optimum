import type { EntityKind } from "@/types";

/** State of an in-progress @ mention trigger (user typed @ and is now filtering). */
export interface MentionTrigger {
  query: string;      // text typed after @, not including the @
  rect: DOMRect;      // caret rect for popover positioning
  anchorNode: Node;   // text node containing the @
  anchorOffset: number; // offset of the @ character in anchorNode
}

/**
 * Look at the current caret and detect whether the user is actively typing
 * an @ mention. Returns the trigger state or null if not in one.
 */
export function detectMentionTrigger(root: HTMLElement): MentionTrigger | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE || !root.contains(node)) return null;
  const text = (node as Text).data;
  const caret = range.startOffset;
  // Walk backwards from caret to find an @ with a clean break before it.
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  // Character immediately before the @ must be absent or whitespace.
  if (at > 0 && !/\s/.test(before[at - 1])) return null;
  // Anything between @ and caret must have no whitespace (live query).
  const query = before.slice(at + 1);
  if (/\s/.test(query)) return null;
  const queryRange = document.createRange();
  queryRange.setStart(node, at);
  queryRange.setEnd(node, caret);
  const rect = queryRange.getBoundingClientRect();
  return { query, rect, anchorNode: node, anchorOffset: at };
}

/**
 * Replace the typed `@query` text with an atomic mention pill, then place
 * the caret right after the pill so the user can continue typing.
 */
export function insertMentionPill(
  trigger: MentionTrigger,
  target: { kind: EntityKind; id: string; title: string },
): void {
  const sel = window.getSelection();
  if (!sel) return;
  const node = trigger.anchorNode as Text;
  // Replace the range `@query` with: [pill][space]
  const range = document.createRange();
  range.setStart(node, trigger.anchorOffset);
  range.setEnd(node, trigger.anchorOffset + 1 + trigger.query.length);
  range.deleteContents();
  const pill = document.createElement("span");
  pill.className = "mention";
  pill.setAttribute("contenteditable", "false");
  pill.setAttribute("data-kind", target.kind);
  pill.setAttribute("data-id", target.id);
  pill.textContent = `@${target.title || "Untitled"}`;
  pill.setAttribute("data-kind-label", target.kind === "note" ? "note" : "card");
  const space = document.createTextNode("\u00A0");
  range.insertNode(space);
  range.insertNode(pill);
  // Caret after the trailing space.
  const after = document.createRange();
  after.setStartAfter(space);
  after.collapse(true);
  sel.removeAllRanges();
  sel.addRange(after);
}

/**
 * Backspace handler: if caret sits immediately after a mention pill, remove
 * the pill as a single unit rather than deleting one character.
 * Returns true if it handled the event.
 */
export function handleBackspaceOverMention(root: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const { startContainer, startOffset } = range;
  if (!root.contains(startContainer)) return false;
  // Find the node immediately before the caret.
  let prev: Node | null = null;
  if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
    prev = startContainer.previousSibling;
  } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
    prev = (startContainer as Element).childNodes[startOffset - 1] ?? null;
  } else if (startContainer.nodeType === Node.TEXT_NODE) {
    // Inside a text node mid-way; check if a single leading char is our joiner.
    const text = (startContainer as Text).data;
    if (startOffset === 1 && text.charCodeAt(0) === 0x00a0) {
      const parentPrev = startContainer.previousSibling;
      if (parentPrev && parentPrev.nodeType === Node.ELEMENT_NODE &&
          (parentPrev as Element).classList.contains("mention")) {
        (parentPrev as Element).remove();
        (startContainer as Text).deleteData(0, 1);
        return true;
      }
    }
  }
  if (prev && prev.nodeType === Node.ELEMENT_NODE && (prev as Element).classList.contains("mention")) {
    (prev as Element).remove();
    return true;
  }
  return false;
}

/** Parse mention references from an HTML string (for server sync). */
export function extractMentions(html: string): Array<{ kind: EntityKind; id: string }> {
  const out: Array<{ kind: EntityKind; id: string }> = [];
  const seen = new Set<string>();
  const re = /<span\b[^>]*class=["'][^"']*\bmention\b[^"']*["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const kind = /\bdata-kind=["'](note|card)["']/i.exec(tag)?.[1] as EntityKind | undefined;
    const id = /\bdata-id=["']([0-9a-f-]{36})["']/i.exec(tag)?.[1];
    if (!kind || !id) continue;
    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind, id });
  }
  return out;
}
