use sqlx::SqlitePool;
use crate::models::time_log::TimeLogRow;

pub async fn list_by_ticket(pool: &SqlitePool, ticket_id: &str) -> Result<Vec<TimeLogRow>, sqlx::Error> {
    sqlx::query_as::<_, TimeLogRow>("SELECT * FROM kanban_time_logs WHERE ticket_id = ? ORDER BY started_at DESC")
        .bind(ticket_id).fetch_all(pool).await
}

pub async fn get_active(pool: &SqlitePool, ticket_id: &str, user_id: &str) -> Result<Option<TimeLogRow>, sqlx::Error> {
    sqlx::query_as::<_, TimeLogRow>(
        "SELECT * FROM kanban_time_logs WHERE ticket_id = ? AND user_id = ? AND ended_at IS NULL LIMIT 1",
    )
    .bind(ticket_id).bind(user_id).fetch_optional(pool).await
}

pub async fn start_time_log(
    pool: &SqlitePool, ticket_id: &str, user_id: &str, started_at: &str, description: Option<&str>,
) -> Result<TimeLogRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, TimeLogRow>(
        "INSERT INTO kanban_time_logs (id, ticket_id, user_id, started_at, description) VALUES (?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(ticket_id).bind(user_id).bind(started_at).bind(description)
    .fetch_one(pool).await
}

pub async fn stop_time_log(pool: &SqlitePool, log_id: &str, ended_at: &str, duration: i64) -> Result<Option<TimeLogRow>, sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    sqlx::query_as::<_, TimeLogRow>(
        "UPDATE kanban_time_logs SET ended_at=?, duration=?, updated_at=? WHERE id=? RETURNING *",
    )
    .bind(ended_at).bind(duration).bind(&now).bind(log_id)
    .fetch_optional(pool).await
}

pub async fn get_time_log(pool: &SqlitePool, id: &str) -> Result<Option<TimeLogRow>, sqlx::Error> {
    sqlx::query_as::<_, TimeLogRow>("SELECT * FROM kanban_time_logs WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn delete_time_log(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM kanban_time_logs WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
