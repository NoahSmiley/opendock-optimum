use crate::dto::board::{Column, CreateColumn};
use crate::error::ApiResult;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_for_board(pool: &PgPool, board_id: Uuid) -> ApiResult<Vec<Column>> {
    let rows = sqlx::query_as::<_, Column>(
        "SELECT * FROM board_columns WHERE board_id = $1 ORDER BY position ASC",
    )
    .bind(board_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn create(pool: &PgPool, board_id: Uuid, input: CreateColumn) -> ApiResult<Column> {
    let position = match input.position {
        Some(p) => p,
        None => {
            let max: Option<(i32,)> = sqlx::query_as(
                "SELECT COALESCE(MAX(position), -1) FROM board_columns WHERE board_id = $1",
            )
            .bind(board_id).fetch_optional(pool).await?;
            max.map(|(m,)| m + 1).unwrap_or(0)
        }
    };
    let row = sqlx::query_as::<_, Column>(
        "INSERT INTO board_columns (id, board_id, title, position)
         VALUES ($1, $2, $3, $4) RETURNING *",
    )
    .bind(Uuid::new_v4()).bind(board_id).bind(&input.title).bind(position)
    .fetch_one(pool).await?;
    Ok(row)
}

pub async fn delete(pool: &PgPool, id: Uuid, board_id: Uuid) -> ApiResult<()> {
    sqlx::query("DELETE FROM board_columns WHERE id = $1 AND board_id = $2")
        .bind(id).bind(board_id).execute(pool).await?;
    Ok(())
}
