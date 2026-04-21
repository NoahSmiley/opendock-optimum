/**
 * Paste sanitizer. Preserves mention pills (span.mention with data-kind and
 * data-id) verbatim, otherwise falls back to plain text so random styled
 * HTML from other apps doesn't leak into the editor.
 *
 * Returns true if the paste was handled (caller should preventDefault).
 */
export function handlePaste(e: React.ClipboardEvent<HTMLElement>): boolean {
  const html = e.clipboardData.getData("text/html");
  const text = e.clipboardData.getData("text/plain");

  if (html && /class=["'][^"']*\bmention\b/i.test(html)) {
    e.preventDefault();
    const safe = sanitizeMentions(html);
    document.execCommand("insertHTML", false, safe);
    return true;
  }

  // Fall back to plain text for all other HTML — avoids fonts/colors/styles
  // from external apps overriding our editor styles.
  if (text) {
    e.preventDefault();
    document.execCommand("insertText", false, text);
    return true;
  }
  return false;
}

/**
 * Keep only mention spans (with their data attrs and safe text content) and
 * plain text; drop everything else.
 */
function sanitizeMentions(html: string): string {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const out = document.createElement("div");
  walk(tpl.content, out);
  return out.innerHTML;
}

function walk(src: ParentNode, dst: HTMLElement) {
  for (const node of Array.from(src.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      dst.appendChild(document.createTextNode((node as Text).data));
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    if (el.tagName === "SPAN" && el.classList.contains("mention")) {
      const kind = el.getAttribute("data-kind");
      const id = el.getAttribute("data-id");
      if ((kind === "note" || kind === "card") && id && /^[0-9a-f-]{36}$/i.test(id)) {
        const pill = document.createElement("span");
        pill.className = "mention";
        pill.setAttribute("contenteditable", "false");
        pill.setAttribute("data-kind", kind);
        pill.setAttribute("data-id", id);
        pill.textContent = el.textContent ?? "";
        dst.appendChild(pill);
        continue;
      }
    }
    walk(el, dst);
  }
}
