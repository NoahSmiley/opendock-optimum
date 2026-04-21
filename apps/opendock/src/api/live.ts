import type { Card, Note } from "@/types";

export type LiveEvent =
  | { kind: "note_updated"; note_id: string; actor_id: string; patch: Note }
  | { kind: "note_deleted"; note_id: string; actor_id: string }
  | { kind: "note_members_changed"; note_id: string; actor_id: string }
  | { kind: "note_share_added"; note_id: string; actor_id: string }
  | { kind: "note_share_removed"; note_id: string; actor_id: string }
  | { kind: "board_updated"; board_id: string; actor_id: string; patch: unknown }
  | { kind: "board_deleted"; board_id: string; actor_id: string }
  | { kind: "board_members_changed"; board_id: string; actor_id: string }
  | { kind: "board_share_added"; board_id: string; actor_id: string }
  | { kind: "board_share_removed"; board_id: string; actor_id: string }
  | { kind: "card_upserted"; board_id: string; actor_id: string; card: Card }
  | { kind: "card_deleted"; board_id: string; card_id: string; actor_id: string }
  | { kind: "entity_link_changed"; a_kind: "note" | "card"; a_id: string; b_kind: "note" | "card"; b_id: string; added: boolean; actor_id: string };
