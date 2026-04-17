use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum LiveEvent {
    NoteUpdated { note_id: Uuid, actor_id: Uuid, patch: serde_json::Value },
    NoteDeleted { note_id: Uuid, actor_id: Uuid },
    NoteMembersChanged { note_id: Uuid, actor_id: Uuid },
    BoardUpdated { board_id: Uuid, actor_id: Uuid, patch: serde_json::Value },
    BoardDeleted { board_id: Uuid, actor_id: Uuid },
    BoardMembersChanged { board_id: Uuid, actor_id: Uuid },
    CardUpserted { board_id: Uuid, actor_id: Uuid, card: serde_json::Value },
    CardDeleted { board_id: Uuid, card_id: Uuid, actor_id: Uuid },
    NoteShareAdded { note_id: Uuid, actor_id: Uuid },
    NoteShareRemoved { note_id: Uuid, actor_id: Uuid },
    BoardShareAdded { board_id: Uuid, actor_id: Uuid },
    BoardShareRemoved { board_id: Uuid, actor_id: Uuid },
}

#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Serialize, Deserialize)]
#[serde(tag = "scope", rename_all = "snake_case")]
pub enum Room {
    Note { id: Uuid },
    Board { id: Uuid },
    User { id: Uuid },
}
