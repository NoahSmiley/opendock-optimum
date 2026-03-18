use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct FileFolderRow {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileFolder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub created_at: String,
}

impl From<FileFolderRow> for FileFolder {
    fn from(r: FileFolderRow) -> Self {
        Self {
            id: r.id, name: r.name, parent_id: r.parent_id,
            created_at: r.created_at,
        }
    }
}
