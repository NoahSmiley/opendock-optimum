use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SprintRow {
    pub id: String,
    pub board_id: String,
    pub name: String,
    pub goal: Option<String>,
    pub start_date: String,
    pub end_date: String,
    pub status: String,
    pub velocity: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Sprint {
    pub id: String,
    pub board_id: String,
    pub name: String,
    pub goal: Option<String>,
    pub start_date: String,
    pub end_date: String,
    pub status: String,
    pub velocity: Option<f64>,
}

impl From<SprintRow> for Sprint {
    fn from(r: SprintRow) -> Self {
        Self {
            id: r.id, board_id: r.board_id, name: r.name, goal: r.goal,
            start_date: r.start_date, end_date: r.end_date,
            status: r.status, velocity: r.velocity,
        }
    }
}
