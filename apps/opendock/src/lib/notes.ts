import type { Note } from "@/types";

export function timeAgo(ts: string | number): string {
  const ms = typeof ts === "string" ? Date.parse(ts) : ts;
  const d = Date.now() - ms;
  if (d < 60_000) return "now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

export function notePreview(content: string): string {
  return content.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 1).join("").slice(0, 80);
}

export function wordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}

export function filterNotes(notes: Note[], search: string): Note[] {
  if (!search) return notes;
  const q = search.toLowerCase();
  return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
}
