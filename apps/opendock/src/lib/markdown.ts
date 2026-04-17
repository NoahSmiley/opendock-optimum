const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

export function renderMarkdown(src: string): string {
  const lines = src.split("\n");
  const out: string[] = [];
  let inCode = false; let inList = false; let codeBuf: string[] = [];
  const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (inCode) { out.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`); codeBuf = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(raw);
    if (h) { closeList(); const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); continue; }
    const cb = /^-\s+\[( |x)\]\s+(.*)$/.exec(raw);
    if (cb) { if (!inList) { out.push("<ul class=\"md-list\">"); inList = true; } out.push(`<li class="md-check"><input type="checkbox" disabled ${cb[1] === "x" ? "checked" : ""}/> ${inline(cb[2])}</li>`); continue; }
    const li = /^-\s+(.*)$/.exec(raw);
    if (li) { if (!inList) { out.push("<ul class=\"md-list\">"); inList = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (raw.trim() === "") { closeList(); out.push(""); continue; }
    closeList(); out.push(`<p>${inline(raw)}</p>`);
  }
  closeList();
  if (inCode) out.push(`<pre><code>${esc(codeBuf.join("\n"))}</code></pre>`);
  return out.join("\n");
}
