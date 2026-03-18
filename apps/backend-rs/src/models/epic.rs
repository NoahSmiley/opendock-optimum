use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EpicRow {
    pub id: String,
    pub board_id: String,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub color: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Epic {
    pub id: String,
    pub board_id: String,
    pub key: String,
    pub title: String,
    pub description: Option<String>,
    pub color: String,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<EpicRow> for Epic {
    fn from(r: EpicRow) -> Self {
        Self {
            id: r.id, board_id: r.board_id, key: r.key, title: r.title,
            description: r.description, color: r.color,
            start_date: r.start_date, end_date: r.end_date,
            status: r.status, created_at: r.created_at, updated_at: r.updated_at,
        }
    }
}
