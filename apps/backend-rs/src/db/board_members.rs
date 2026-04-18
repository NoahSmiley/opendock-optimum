use crate::dto::board::BoardMember;
use crate::error::{ApiError, ApiResult};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list(pool: &PgPool, board_id: Uuid) -> ApiResult<Vec<BoardMember>> {
    let rows = sqlx::query_as::<_, BoardMember>(
        "SELECT m.user_id, u.email, u.display_name, m.role::text
         FROM board_members m JOIN users u ON u.id = m.user_id
         WHERE m.board_id = $1 ORDER BY m.role = 'owner' DESC, u.email ASC",
    )
    .bind(board_id).fetch_all(pool).await?;
    Ok(rows)
}

pub async fn ids(pool: &PgPool, board_id: Uuid) -> ApiResult<Vec<Uuid>> {
    let rows: Vec<(Uuid,)> = sqlx::query_as("SELECT user_id FROM board_members WHERE board_id = $1")
        .bind(board_id).fetch_all(pool).await?;
    Ok(rows.into_iter().map(|(u,)| u).collect())
}

pub async fn add(pool: &PgPool, board_id: Uuid, owner_id: Uuid, user_id: Uuid) -> ApiResult<()> {
    let owns: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM boards WHERE id = $1 AND owner_id = $2")
        .bind(board_id).bind(owner_id).fetch_optional(pool).await?;
    if owns.is_none() { return Err(ApiError::NotFound); }
    sqlx::query("INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING")
        .bind(board_id).bind(user_id).execute(pool).await?;
    Ok(())
}

pub async fn remove(pool: &PgPool, board_id: Uuid, owner_id: Uuid, user_id: Uuid) -> ApiResult<()> {
    let owns: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM boards WHERE id = $1 AND owner_id = $2")
        .bind(board_id).bind(owner_id).fetch_optional(pool).await?;
    if owns.is_none() { return Err(ApiError::NotFound); }
    sqlx::query("DELETE FROM board_members WHERE board_id = $1 AND user_id = $2 AND role <> 'owner'")
        .bind(board_id).bind(user_id).execute(pool).await?;
    Ok(())
}

pub async fn resolve_id(pool: &PgPool, user_id: Option<Uuid>, email: Option<&str>) -> ApiResult<Uuid> {
    if let Some(id) = user_id { return Ok(id); }
    let email = email.ok_or(ApiError::NotFound)?;
    let row: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM users WHERE LOWER(email) = LOWER($1)")
        .bind(email).fetch_optional(pool).await?;
    row.map(|(u,)| u).ok_or(ApiError::NotFound)
}
