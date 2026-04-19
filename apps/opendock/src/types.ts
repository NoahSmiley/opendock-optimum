export type Tool = "notes" | "boards" | "profile";
export type MobileView = "list" | "detail";

export interface AuthData {
  token?: string;
  user_id?: string;
  email?: string;
  display_name?: string;
}

export interface Note {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoteMember {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "owner" | "editor" | "viewer";
}

export interface UserSummary {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Board {
  id: string;
  owner_id: string;
  name: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
}

export interface Card {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string;
  position: number;
  assignee_id: string | null;
  updated_at: string;
}

export interface BoardMember {
  user_id: string;
  email: string;
  display_name: string | null;
  role: "owner" | "member";
}

export interface BoardDetail {
  board: Board;
  columns: Column[];
  cards: Card[];
  members: BoardMember[];
}
