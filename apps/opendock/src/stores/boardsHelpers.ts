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

export function upsertCard(d: BoardDetail | null, c: Card): BoardDetail | null {
  if (!d) return d;
  const i = d.cards.findIndex((x) => x.id === c.id);
  return { ...d, cards: i >= 0 ? d.cards.map((x, k) => k === i ? c : x) : [...d.cards, c] };
}

export function applyBoardEvent(d: BoardDetail | null, ev: LiveEvent): BoardDetail | null {
  if (!d) return d;
  if (ev.kind === "card_upserted" && ev.board_id === d.board.id) return upsertCard(d, ev.card);
  if (ev.kind === "card_deleted" && ev.board_id === d.board.id) return removeCard(d, ev.card_id);
  return d;
}
