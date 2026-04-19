function ensureCheckbox(li: HTMLElement) {
  const existing = li.querySelectorAll(".check-box");
  existing.forEach((el, i) => { if (i > 0) el.remove(); });
  if (existing.length === 0) {
    const box = document.createElement("span");
    box.className = "check-box";
    box.setAttribute("contenteditable", "false");
    li.insertBefore(box, li.firstChild);
  } else {
    const box = existing[0];
    if (box !== li.firstChild) li.insertBefore(box, li.firstChild);
  }
}

function ensureCheckText(li: HTMLElement) {
  const existing = li.querySelectorAll(".check-text");
  let text: HTMLElement;
  if (existing.length > 1) {
    text = existing[existing.length - 1] as HTMLElement;
    for (let i = 0; i < existing.length - 1; i++) existing[i].remove();
    li.appendChild(text);
  } else if (existing.length === 1) {
    text = existing[0] as HTMLElement;
  } else {
    text = document.createElement("span");
    text.className = "check-text";
    while (li.childNodes.length > 1) {
      const node = li.childNodes[li.childNodes.length - 1];
      text.insertBefore(node, text.firstChild);
    }
    li.appendChild(text);
  }
  if (!text.firstChild || text.textContent?.length === 0) {
    text.innerHTML = "";
    text.appendChild(document.createElement("br"));
  }
}

export function normalizeChecklists(root: HTMLElement) {
  const checklists = Array.from(root.querySelectorAll<HTMLElement>("ul.checklist"));
  for (const ul of checklists) {
    const items = Array.from(ul.children).filter((c): c is HTMLElement => c.tagName === "LI");
    for (const li of items) {
      li.classList.add("check-item");
      ensureCheckbox(li);
      ensureCheckText(li);
      const nested = li.querySelectorAll("ul.checklist, ol, ul:not(.checklist)");
      nested.forEach((n) => n.remove());
    }
  }
}
