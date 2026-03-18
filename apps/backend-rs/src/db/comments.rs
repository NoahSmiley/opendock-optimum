use sqlx::SqlitePool;
use crate::models::comment::CommentRow;

#[allow(dead_code)]
pub async fn list_by_ticket(pool: &SqlitePool, ticket_id: &str) -> Result<Vec<CommentRow>, sqlx::Error> {
    sqlx::query_as::<_, CommentRow>("SELECT * FROM kanban_comments WHERE ticket_id = ? ORDER BY created_at ASC")
        .bind(ticket_id).fetch_all(pool).await
}

pub async fn add_comment(pool: &SqlitePool, ticket_id: &str, user_id: &str, content: &str) -> Result<CommentRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, CommentRow>(
        "INSERT INTO kanban_comments (id, ticket_id, user_id, content) VALUES (?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(ticket_id).bind(user_id).bind(content)
    .fetch_one(pool).await
}

pub async fn delete_comment(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM kanban_comments WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
