use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TimeLogRow {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration: i64,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeLog {
    pub id: String,
    pub ticket_id: String,
    pub user_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration: i64,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

impl From<TimeLogRow> for TimeLog {
    fn from(r: TimeLogRow) -> Self {
        Self {
            id: r.id, ticket_id: r.ticket_id, user_id: r.user_id,
            started_at: r.started_at, ended_at: r.ended_at,
            duration: r.duration, description: r.description,
            created_at: r.created_at, updated_at: r.updated_at,
        }
    }
}
