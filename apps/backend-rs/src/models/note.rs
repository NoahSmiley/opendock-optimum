use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct NoteRow {
    pub id: String,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub folder_id: Option<String>,
    pub tags: String,
    pub is_pinned: i32,
    pub is_archived: i32,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub content_type: Option<String>,
    pub folder_id: Option<String>,
    pub tags: Vec<String>,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}
