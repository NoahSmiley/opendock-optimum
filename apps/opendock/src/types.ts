export type Tool = "notes" | "boards" | "calendar";
export type MobileView = "list" | "detail";

export interface Note { id: string; title: string; content: string; pinned: boolean; updatedAt: number }

export interface Card { id: string; title: string; description: string; columnId: string; order: number; updatedAt: number }
export interface Column { id: string; title: string; order: number }
export interface Board { id: string; name: string; columns: Column[]; cards: Card[] }
