import type { Card, Note } from "@/types";

export type LiveEvent =
  | { kind: "note_updated"; note_id: string; actor_id: string; patch: Note }
  | { kind: "note_deleted"; note_id: string; actor_id: string }
  | { kind: "note_members_changed"; note_id: string; actor_id: string }
  | { kind: "board_updated"; board_id: string; actor_id: string; patch: unknown }
  | { kind: "board_deleted"; board_id: string; actor_id: string }
  | { kind: "board_members_changed"; board_id: string; actor_id: string }
  | { kind: "card_upserted"; board_id: string; actor_id: string; card: Card }
  | { kind: "card_deleted"; board_id: string; card_id: string; actor_id: string };
