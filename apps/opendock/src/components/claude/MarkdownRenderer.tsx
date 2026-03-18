import type { ReactNode } from "react";

/** Parse inline markdown: **bold**, `code`, _italic_, emoji shortcodes */
export function formatInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`(.+?)`|_(.+?)_)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={match.index}>{match[2]}</strong>);
    else if (match[3]) parts.push(<code key={match.index} className="claude-md-code">{match[3]}</code>);
    else if (match[4]) parts.push(<em key={match.index}>{match[4]}</em>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function isTableSeparator(line: string) {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTableRow(line: string) {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function renderTable(lines: string[], startIdx: number): { element: ReactNode; endIdx: number } {
  const headers = parseTableRow(lines[startIdx]);
  let i = startIdx + 1;
  if (i < lines.length && isTableSeparator(lines[i])) i++;

  const rows: string[][] = [];
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    rows.push(parseTableRow(lines[i]));
    i++;
  }

  return {
    element: (
      <div key={startIdx} className="claude-md-table-wrap">
        <table className="claude-md-table">
          <thead>
            <tr>{headers.map((h, j) => <th key={j}>{formatInline(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{formatInline(cell)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    endIdx: i - 1,
  };
}

/** Render markdown block: tables, numbered lists, bullets, paragraphs */
export function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Table: starts with | and next line is separator
    if (line.trim().startsWith("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const { element, endIdx } = renderTable(lines, i);
      elements.push(element);
      i = endIdx + 1;
      continue;
    }

    // Numbered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const content = line.replace(/^\s*\d+[.)]\s+/, "");
      const num = line.match(/^\s*(\d+)/)?.[1];
      elements.push(
        <div key={i} className="claude-md-numbered">
          <span className="claude-md-num">{num}.</span>
          <span>{formatInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*]\s+/, "");
      elements.push(
        <div key={i} className="claude-md-bullet">
          <span className="claude-md-dot" />
          <span>{formatInline(content)}</span>
        </div>
      );
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={i} className="claude-md-break" />);
      i++;
      continue;
    }

    // Regular line
    elements.push(<div key={i}>{formatInline(line)}</div>);
    i++;
  }

  return elements;
}
