import type { ListType } from "./lists";

export interface ToolbarState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  ul: boolean;
  ol: boolean;
  check: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
}

function queryListType(root: HTMLElement): ListType | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  let n: Node | null = sel.getRangeAt(0).startContainer;
  while (n && n !== root) {
    if (n.nodeType === 1) {
      const el = n as Element;
      if (el.tagName === "UL" && el.classList.contains("checklist")) return "checklist";
      if (el.tagName === "UL") return "ul";
      if (el.tagName === "OL") return "ol";
    }
    n = n.parentNode;
  }
  return null;
}

export function activeState(root: HTMLElement | null): ToolbarState {
  const is = (c: string) => { try { return document.queryCommandState(c); } catch { return false; } };
  const block = (() => { try { return document.queryCommandValue("formatBlock").toLowerCase(); } catch { return ""; } })();
  const listType = root ? queryListType(root) : null;
  return {
    bold: is("bold"),
    italic: is("italic"),
    underline: is("underline"),
    strike: is("strikeThrough"),
    ul: listType === "ul",
    ol: listType === "ol",
    check: listType === "checklist",
    h1: block === "h1",
    h2: block === "h2",
    h3: block === "h3",
  };
}
