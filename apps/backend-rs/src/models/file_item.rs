use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FileItemRow {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub size: i64,
    pub folder_id: Option<String>,
    pub url: String,
    pub thumbnail_url: Option<String>,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileItem {
    pub id: String,
    pub name: String,
    pub mime_type: String,
    pub size: i64,
    pub folder_id: Option<String>,
    pub url: String,
    pub thumbnail_url: Option<String>,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<FileItemRow> for FileItem {
    fn from(r: FileItemRow) -> Self {
        Self {
            id: r.id, name: r.name, mime_type: r.mime_type, size: r.size,
            folder_id: r.folder_id, url: r.url, thumbnail_url: r.thumbnail_url,
            user_id: r.user_id, created_at: r.created_at, updated_at: r.updated_at,
        }
    }
}
