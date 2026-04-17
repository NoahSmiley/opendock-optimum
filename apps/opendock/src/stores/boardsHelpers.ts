import type { BoardDetail, Card, Column } from "@/types";

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
