use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use super::attachment::Attachment;
use super::comment::Comment;
use super::time_log::TimeLog;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TicketRow {
    pub id: String,
    pub key: Option<String>,
    pub board_id: String,
    pub column_id: String,
    pub title: String,
    pub description: Option<String>,
    pub issue_type: Option<String>,
    pub epic_id: Option<String>,
    pub assignee_ids: String,
    pub tags: String,
    pub label_ids: String,
    pub estimate: Option<f64>,
    pub story_points: Option<f64>,
    pub time_spent: Option<i64>,
    pub time_original_estimate: Option<i64>,
    pub time_remaining: Option<i64>,
    pub priority: String,
    pub sprint_id: Option<String>,
    pub due_date: Option<String>,
    pub components: Option<String>,
    pub fix_version: Option<String>,
    pub order: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Ticket {
    pub id: String,
    pub key: Option<String>,
    pub board_id: String,
    pub column_id: String,
    pub title: String,
    pub description: Option<String>,
    pub issue_type: Option<String>,
    pub epic_id: Option<String>,
    pub assignee_ids: Vec<String>,
    pub tags: Vec<String>,
    pub label_ids: Vec<String>,
    pub estimate: Option<f64>,
    pub story_points: Option<f64>,
    pub time_spent: Option<i64>,
    pub time_original_estimate: Option<i64>,
    pub time_remaining: Option<i64>,
    pub priority: String,
    pub sprint_id: Option<String>,
    pub due_date: Option<String>,
    pub components: Vec<String>,
    pub fix_version: Option<String>,
    pub order: i64,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comments: Option<Vec<Comment>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_logs: Option<Vec<TimeLog>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachment>>,
}
