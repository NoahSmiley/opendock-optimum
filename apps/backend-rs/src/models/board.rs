use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::column::Column;
use super::epic::Epic;
use super::label::Label;
use super::sprint::Sprint;
use super::ticket::Ticket;

/// Raw DB row for kanban_boards.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct BoardRow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<String>,
    pub project_key: Option<String>,
    pub project_type: Option<String>,
    pub member_ids: String,     // JSON array
    pub active_sprint_id: Option<String>,
    pub components: Option<String>,  // JSON array
    pub created_at: String,
}

/// Hydrated board for API responses.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Board {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub project_id: Option<String>,
    pub project_key: Option<String>,
    pub project_type: Option<String>,
    pub created_at: String,
    pub member_ids: Vec<String>,
    pub active_sprint_id: Option<String>,
    pub columns: Vec<Column>,
    pub tickets: Vec<Ticket>,
    pub sprints: Vec<Sprint>,
    pub epics: Vec<Epic>,
    pub members: Vec<super::user::KanbanUser>,
    pub labels: Vec<Label>,
    pub components: Vec<String>,
}

/// Full snapshot returned by board endpoints.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardSnapshot {
    pub board: Board,
    pub columns: Vec<Column>,
    pub tickets: Vec<Ticket>,
    pub sprints: Vec<Sprint>,
    pub members: Vec<super::user::KanbanUser>,
    pub labels: Vec<Label>,
}
