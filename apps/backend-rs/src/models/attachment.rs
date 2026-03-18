use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AttachmentRow {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub filename: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size: i64,
    pub url: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attachment {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub filename: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size: i64,
    pub url: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<AttachmentRow> for Attachment {
    fn from(r: AttachmentRow) -> Self {
        Self {
            id: r.id, ticket_id: r.ticket_id, user_id: r.user_id,
            filename: r.filename, original_filename: r.original_filename,
            mime_type: r.mime_type, size: r.size, url: r.url,
            created_at: r.created_at, updated_at: r.updated_at,
        }
    }
}
