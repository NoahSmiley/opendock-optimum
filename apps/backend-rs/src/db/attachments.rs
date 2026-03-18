use sqlx::SqlitePool;
use crate::models::attachment::AttachmentRow;

pub async fn list_by_ticket(pool: &SqlitePool, ticket_id: &str) -> Result<Vec<AttachmentRow>, sqlx::Error> {
    sqlx::query_as::<_, AttachmentRow>("SELECT * FROM kanban_attachments WHERE ticket_id = ? ORDER BY created_at ASC")
        .bind(ticket_id).fetch_all(pool).await
}

pub async fn create_attachment(
    pool: &SqlitePool, ticket_id: &str, user_id: &str,
    filename: &str, original_filename: &str, mime_type: &str, size: i64, url: &str,
) -> Result<AttachmentRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, AttachmentRow>(
        "INSERT INTO kanban_attachments (id, ticket_id, user_id, filename, original_filename, mime_type, size, url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(ticket_id).bind(user_id).bind(filename)
    .bind(original_filename).bind(mime_type).bind(size).bind(url)
    .fetch_one(pool).await
}

pub async fn get_attachment(pool: &SqlitePool, id: &str) -> Result<Option<AttachmentRow>, sqlx::Error> {
    sqlx::query_as::<_, AttachmentRow>("SELECT * FROM kanban_attachments WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn delete_attachment(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM kanban_attachments WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
