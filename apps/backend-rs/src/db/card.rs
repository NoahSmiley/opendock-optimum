use crate::dto::board::{Card, CreateCard, UpdateCard};
use crate::error::{ApiError, ApiResult};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_for_board(pool: &PgPool, board_id: Uuid) -> ApiResult<Vec<Card>> {
    let rows = sqlx::query_as::<_, Card>(
        "SELECT * FROM board_cards WHERE board_id = $1 ORDER BY column_id, position ASC",
    )
    .bind(board_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn create(pool: &PgPool, board_id: Uuid, input: CreateCard) -> ApiResult<Card> {
    let max: Option<(i32,)> = sqlx::query_as(
        "SELECT COALESCE(MAX(position), -1) FROM board_cards WHERE column_id = $1",
    )
    .bind(input.column_id).fetch_optional(pool).await?;
    let position = max.map(|(m,)| m + 1).unwrap_or(0);
    let row = sqlx::query_as::<_, Card>(
        "INSERT INTO board_cards (id, board_id, column_id, title, description, position, assignee_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    )
    .bind(Uuid::new_v4()).bind(board_id).bind(input.column_id)
    .bind(&input.title).bind(input.description.unwrap_or_default())
    .bind(position).bind(input.assignee_id)
    .fetch_one(pool).await?;
    Ok(row)
}

pub async fn update(pool: &PgPool, id: Uuid, board_id: Uuid, input: UpdateCard) -> ApiResult<Card> {
    let mut tx = pool.begin().await?;
    if let Some(pos) = input.position {
        let target_col: (Uuid,) = sqlx::query_as("SELECT COALESCE($1, column_id) FROM board_cards WHERE id = $2 AND board_id = $3")
            .bind(input.column_id).bind(id).bind(board_id).fetch_one(&mut *tx).await?;
        sqlx::query("UPDATE board_cards SET position = position + 1000 WHERE column_id = $1 AND position >= $2 AND id != $3")
            .bind(target_col.0).bind(pos).bind(id).execute(&mut *tx).await?;
        sqlx::query("WITH renumbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_pos FROM board_cards WHERE column_id = $1 AND id != $2) UPDATE board_cards c SET position = r.new_pos FROM renumbered r WHERE c.id = r.id")
            .bind(target_col.0).bind(id).execute(&mut *tx).await?;
    }
    let row = sqlx::query_as::<_, Card>(
        "UPDATE board_cards SET
           title = COALESCE($3, title), description = COALESCE($4, description),
           column_id = COALESCE($5, column_id), position = COALESCE($6, position),
           assignee_id = CASE WHEN $7::boolean THEN $8 ELSE assignee_id END, updated_at = NOW()
         WHERE id = $1 AND board_id = $2 RETURNING *",
    )
    .bind(id).bind(board_id).bind(input.title).bind(input.description)
    .bind(input.column_id).bind(input.position)
    .bind(input.assignee_id.is_some()).bind(input.assignee_id.flatten())
    .fetch_optional(&mut *tx).await?.ok_or(ApiError::NotFound)?;
    tx.commit().await?;
    Ok(row)
}

pub async fn delete(pool: &PgPool, id: Uuid, board_id: Uuid) -> ApiResult<()> {
    let res = sqlx::query("DELETE FROM board_cards WHERE id = $1 AND board_id = $2")
        .bind(id).bind(board_id).execute(pool).await?;
    if res.rows_affected() == 0 { return Err(ApiError::NotFound); }
    Ok(())
}
