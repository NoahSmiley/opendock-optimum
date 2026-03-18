use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ActivityRow {
    pub id: String,
    pub board_id: String,
    pub user_id: String,
    #[sqlx(rename = "type")]
    pub activity_type: String,
    pub ticket_id: Option<String>,
    pub column_id: Option<String>,
    pub sprint_id: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Activity {
    pub id: String,
    pub board_id: String,
    pub user_id: String,
    #[serde(rename = "type")]
    pub activity_type: String,
    pub ticket_id: Option<String>,
    pub column_id: Option<String>,
    pub sprint_id: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: String,
}

impl From<ActivityRow> for Activity {
    fn from(r: ActivityRow) -> Self {
        let metadata = r.metadata
            .and_then(|s| serde_json::from_str(&s).ok());
        Self {
            id: r.id, board_id: r.board_id, user_id: r.user_id,
            activity_type: r.activity_type, ticket_id: r.ticket_id,
            column_id: r.column_id, sprint_id: r.sprint_id,
            metadata, created_at: r.created_at,
        }
    }
}
