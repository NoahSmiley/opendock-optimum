use sqlx::SqlitePool;
use crate::models::activity::ActivityRow;

#[allow(dead_code)]
pub async fn log_activity(
    pool: &SqlitePool, board_id: &str, user_id: &str, activity_type: &str,
    ticket_id: Option<&str>, column_id: Option<&str>, sprint_id: Option<&str>,
    metadata: Option<&str>,
) -> Result<ActivityRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, ActivityRow>(
        "INSERT INTO kanban_activities (id, board_id, user_id, type, ticket_id, column_id, sprint_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(board_id).bind(user_id).bind(activity_type)
    .bind(ticket_id).bind(column_id).bind(sprint_id).bind(metadata)
    .fetch_one(pool).await
}

pub async fn list_by_board(pool: &SqlitePool, board_id: &str, limit: i64) -> Result<Vec<ActivityRow>, sqlx::Error> {
    sqlx::query_as::<_, ActivityRow>(
        "SELECT * FROM kanban_activities WHERE board_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .bind(board_id).bind(limit).fetch_all(pool).await
}

pub async fn list_by_ticket(pool: &SqlitePool, ticket_id: &str, limit: i64) -> Result<Vec<ActivityRow>, sqlx::Error> {
    sqlx::query_as::<_, ActivityRow>(
        "SELECT * FROM kanban_activities WHERE ticket_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .bind(ticket_id).bind(limit).fetch_all(pool).await
}
