use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CommentRow {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Comment {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<CommentRow> for Comment {
    fn from(r: CommentRow) -> Self {
        Self {
            id: r.id, ticket_id: r.ticket_id, user_id: r.user_id,
            content: r.content, created_at: r.created_at, updated_at: r.updated_at,
        }
    }
}
