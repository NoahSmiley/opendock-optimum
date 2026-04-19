import * as api from "@/api/boards";
import type { BoardDetail, Card, Column } from "@/types";
import type { LiveEvent } from "@/api/live";

export async function addMember(boardId: string, email: string, reload: () => Promise<void>): Promise<boolean> {
  await api.addBoardMember(boardId, email);
  await reload();
  return true;
}

export async function removeMember(boardId: string, userId: string, reload: () => Promise<void>): Promise<void> {
  await api.removeBoardMember(boardId, userId);
  await reload();
}

export function withColumn(d: BoardDetail | null, c: Column): BoardDetail | null {
  return d ? { ...d, columns: [...d.columns, c] } : d;
}

export function withCard(d: BoardDetail | null, c: Card): BoardDetail | null {
  return d ? { ...d, cards: [...d.cards, c] } : d;
}

export function replaceCard(d: BoardDetail | null, c: Card): BoardDetail | null {
  return d ? { ...d, cards: d.cards.map((x) => x.id === c.id ? c : x) } : d;
}

export function removeCard(d: BoardDetail | null, id: string): BoardDetail | null {
  return d ? { ...d, cards: d.cards.filter((c) => c.id !== id) } : d;
}

export function replaceColumn(d: BoardDetail | null, c: Column): BoardDetail | null {
  return d ? { ...d, columns: d.columns.map((x) => x.id === c.id ? c : x) } : d;
}

export function removeColumn(d: BoardDetail | null, id: string): BoardDetail | null {
  if (!d) return d;
  return { ...d, columns: d.columns.filter((c) => c.id !== id), cards: d.cards.filter((c) => c.column_id !== id) };
}

function upsertCard(d: BoardDetail, c: Card): BoardDetail {
  const i = d.cards.findIndex((x) => x.id === c.id);
  return { ...d, cards: i >= 0 ? d.cards.map((x, k) => k === i ? c : x) : [...d.cards, c] };
}

function applyBoardUpdated(d: BoardDetail, patch: unknown): BoardDetail {
  if (!patch || typeof patch !== "object") return d;
  const p = patch as { column?: Column; removed_column_id?: string };
  if (p.column) {
    const i = d.columns.findIndex((c) => c.id === p.column!.id);
    return { ...d, columns: i >= 0 ? d.columns.map((c, k) => k === i ? p.column! : c) : [...d.columns, p.column!] };
  }
  if (p.removed_column_id) return removeColumn(d, p.removed_column_id) ?? d;
  return d;
}

export function applyBoardEvent(d: BoardDetail | null, ev: LiveEvent): BoardDetail | null {
  if (!d) return d;
  if (ev.kind === "card_upserted" && ev.board_id === d.board.id) return upsertCard(d, ev.card);
  if (ev.kind === "card_deleted" && ev.board_id === d.board.id) return removeCard(d, ev.card_id);
  if (ev.kind === "board_updated" && ev.board_id === d.board.id) return applyBoardUpdated(d, ev.patch);
  return d;
}

export function applyColumnReorderLocally(d: BoardDetail, columnId: string, beforeColumnId: string | null): { detail: BoardDetail; position: number } | null {
  const col = d.columns.find((c) => c.id === columnId); if (!col) return null;
  const siblings = d.columns.filter((c) => c.id !== columnId).sort((a, b) => a.position - b.position);
  const idx = beforeColumnId ? siblings.findIndex((c) => c.id === beforeColumnId) : -1;
  const position = idx >= 0 ? idx : siblings.length;
  if (col.position === position) return null;
  const moved = { ...col, position };
  const reordered = [...siblings.slice(0, position), moved, ...siblings.slice(position)];
  const renumbered = new Map(reordered.map((c, i) => [c.id, { ...c, position: i }]));
  const columns = d.columns.map((c) => renumbered.get(c.id) ?? c);
  return { detail: { ...d, columns }, position };
}

export function applyReorderLocally(d: BoardDetail, cardId: string, toColumnId: string, beforeCardId: string | null): { detail: BoardDetail; position: number } | null {
  const card = d.cards.find((c) => c.id === cardId); if (!card) return null;
  const siblings = d.cards.filter((c) => c.column_id === toColumnId && c.id !== cardId).sort((a, b) => a.position - b.position);
  const idx = beforeCardId ? siblings.findIndex((c) => c.id === beforeCardId) : -1;
  const position = idx >= 0 ? idx : siblings.length;
  if (card.column_id === toColumnId && card.position === position) return null;
  const moved = { ...card, column_id: toColumnId, position };
  const reordered = [...siblings.slice(0, position), moved, ...siblings.slice(position)];
  const renumbered = new Map(reordered.map((c, i) => [c.id, { ...c, position: i }]));
  const cards = d.cards.map((c) => renumbered.get(c.id) ?? c);
  return { detail: { ...d, cards }, position };
}
