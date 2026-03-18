use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CalendarEventRow {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub all_day: i32,
    pub color: String,
    pub location: Option<String>,
    pub board_ticket_id: Option<String>,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CalendarEvent {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub start_time: String,
    pub end_time: String,
    pub all_day: bool,
    pub color: String,
    pub location: Option<String>,
    pub board_ticket_id: Option<String>,
    pub user_id: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<CalendarEventRow> for CalendarEvent {
    fn from(r: CalendarEventRow) -> Self {
        Self {
            id: r.id, title: r.title, description: r.description,
            start_time: r.start_time, end_time: r.end_time,
            all_day: r.all_day != 0, color: r.color, location: r.location,
            board_ticket_id: r.board_ticket_id, user_id: r.user_id,
            created_at: r.created_at, updated_at: r.updated_at,
        }
    }
}
