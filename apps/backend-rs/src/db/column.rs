use crate::dto::board::{Column, CreateColumn, UpdateColumn};
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

pub async fn update(pool: &PgPool, id: Uuid, board_id: Uuid, input: UpdateColumn) -> ApiResult<Column> {
    let mut tx = pool.begin().await?;
    if let Some(pos) = input.position {
        sqlx::query("UPDATE board_columns SET position = position + 1000 WHERE board_id = $1 AND position >= $2 AND id != $3")
            .bind(board_id).bind(pos).bind(id).execute(&mut *tx).await?;
        sqlx::query("UPDATE board_columns SET position = $1 WHERE id = $2 AND board_id = $3")
            .bind(pos).bind(id).bind(board_id).execute(&mut *tx).await?;
        sqlx::query("WITH renumbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_pos FROM board_columns WHERE board_id = $1 AND id != $2) UPDATE board_columns c SET position = r.new_pos FROM renumbered r WHERE c.id = r.id")
            .bind(board_id).bind(id).execute(&mut *tx).await?;
    }
    if let Some(title) = input.title {
        sqlx::query("UPDATE board_columns SET title = $1 WHERE id = $2 AND board_id = $3")
            .bind(title).bind(id).bind(board_id).execute(&mut *tx).await?;
    }
    let row = sqlx::query_as::<_, Column>("SELECT * FROM board_columns WHERE id = $1 AND board_id = $2")
        .bind(id).bind(board_id).fetch_one(&mut *tx).await?;
    tx.commit().await?;
    Ok(row)
}
