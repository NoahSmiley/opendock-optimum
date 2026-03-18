use sqlx::SqlitePool;

use crate::models::column::ColumnRow;

pub async fn list_by_board(pool: &SqlitePool, board_id: &str) -> Result<Vec<ColumnRow>, sqlx::Error> {
    sqlx::query_as::<_, ColumnRow>(
        r#"SELECT * FROM kanban_columns WHERE board_id = ? ORDER BY "order" ASC"#,
    )
    .bind(board_id)
    .fetch_all(pool)
    .await
}

pub async fn create_column(
    pool: &SqlitePool,
    board_id: &str,
    title: &str,
    order: i64,
) -> Result<ColumnRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, ColumnRow>(
        r#"INSERT INTO kanban_columns (id, board_id, title, "order")
         VALUES (?, ?, ?, ?) RETURNING *"#,
    )
    .bind(&id)
    .bind(board_id)
    .bind(title)
    .bind(order)
    .fetch_one(pool)
    .await
}

pub async fn update_column(
    pool: &SqlitePool,
    column_id: &str,
    title: Option<&str>,
    wip_limit: Option<Option<i64>>,
) -> Result<Option<ColumnRow>, sqlx::Error> {
    let existing = sqlx::query_as::<_, ColumnRow>(
        "SELECT * FROM kanban_columns WHERE id = ?",
    )
    .bind(column_id)
    .fetch_optional(pool)
    .await?;
    let e = match existing {
        Some(e) => e,
        None => return Ok(None),
    };
    let t = title.unwrap_or(&e.title);
    let w = match wip_limit {
        Some(v) => v,
        None => e.wip_limit,
    };
    sqlx::query_as::<_, ColumnRow>(
        "UPDATE kanban_columns SET title = ?, wip_limit = ? WHERE id = ? RETURNING *",
    )
    .bind(t)
    .bind(w)
    .bind(column_id)
    .fetch_optional(pool)
    .await
}

pub async fn delete_column(pool: &SqlitePool, column_id: &str) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM kanban_columns WHERE id = ?")
        .bind(column_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn max_order(pool: &SqlitePool, board_id: &str) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"SELECT COALESCE(MAX("order"), -1) FROM kanban_columns WHERE board_id = ?"#,
    )
    .bind(board_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}
