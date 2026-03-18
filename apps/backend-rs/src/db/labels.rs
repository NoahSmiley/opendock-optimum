use sqlx::SqlitePool;
use crate::models::label::LabelRow;

pub async fn list_by_board(pool: &SqlitePool, board_id: &str) -> Result<Vec<LabelRow>, sqlx::Error> {
    sqlx::query_as::<_, LabelRow>("SELECT * FROM kanban_labels WHERE board_id = ? ORDER BY created_at ASC")
        .bind(board_id)
        .fetch_all(pool)
        .await
}

pub async fn create_label(pool: &SqlitePool, board_id: &str, name: &str, color: &str) -> Result<LabelRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, LabelRow>(
        "INSERT INTO kanban_labels (id, board_id, name, color) VALUES (?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(board_id).bind(name).bind(color)
    .fetch_one(pool).await
}

pub async fn update_label(pool: &SqlitePool, id: &str, name: Option<&str>, color: Option<&str>) -> Result<Option<LabelRow>, sqlx::Error> {
    let existing = sqlx::query_as::<_, LabelRow>("SELECT * FROM kanban_labels WHERE id = ?")
        .bind(id).fetch_optional(pool).await?;
    let e = match existing { Some(e) => e, None => return Ok(None) };
    let n = name.unwrap_or(&e.name);
    let c = color.unwrap_or(&e.color);
    sqlx::query_as::<_, LabelRow>("UPDATE kanban_labels SET name=?, color=? WHERE id=? RETURNING *")
        .bind(n).bind(c).bind(id).fetch_optional(pool).await
}

pub async fn delete_label(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM kanban_labels WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
