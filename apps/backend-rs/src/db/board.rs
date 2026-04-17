use crate::dto::board::{Board, CreateBoard, UpdateBoard};
use crate::error::{ApiError, ApiResult};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_for_user(pool: &PgPool, user_id: Uuid) -> ApiResult<Vec<Board>> {
    let rows = sqlx::query_as::<_, Board>(
        "SELECT b.* FROM boards b
         WHERE b.owner_id = $1
            OR EXISTS (SELECT 1 FROM board_members m WHERE m.board_id = b.id AND m.user_id = $1)
         ORDER BY b.pinned DESC, b.updated_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

pub async fn create(pool: &PgPool, owner_id: Uuid, input: CreateBoard) -> ApiResult<Board> {
    let id = Uuid::new_v4();
    let row = sqlx::query_as::<_, Board>(
        "INSERT INTO boards (id, owner_id, name) VALUES ($1, $2, $3) RETURNING *",
    )
    .bind(id).bind(owner_id).bind(&input.name)
    .fetch_one(pool).await?;
    sqlx::query("INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'owner')")
        .bind(id).bind(owner_id).execute(pool).await?;
    for (pos, title) in ["To Do", "In Progress", "Done"].iter().enumerate() {
        sqlx::query("INSERT INTO board_columns (id, board_id, title, position) VALUES ($1, $2, $3, $4)")
            .bind(Uuid::new_v4()).bind(id).bind(title).bind(pos as i32)
            .execute(pool).await?;
    }
    Ok(row)
}

pub async fn update(pool: &PgPool, id: Uuid, owner_id: Uuid, input: UpdateBoard) -> ApiResult<Board> {
    sqlx::query_as::<_, Board>(
        "UPDATE boards SET
           name = COALESCE($3, name),
           pinned = COALESCE($4, pinned),
           updated_at = NOW()
         WHERE id = $1 AND owner_id = $2 RETURNING *",
    )
    .bind(id).bind(owner_id).bind(input.name).bind(input.pinned)
    .fetch_optional(pool).await?
    .ok_or(ApiError::NotFound)
}

pub async fn delete(pool: &PgPool, id: Uuid, owner_id: Uuid) -> ApiResult<()> {
    let res = sqlx::query("DELETE FROM boards WHERE id = $1 AND owner_id = $2")
        .bind(id).bind(owner_id).execute(pool).await?;
    if res.rows_affected() == 0 { return Err(ApiError::NotFound); }
    Ok(())
}

pub async fn is_member(pool: &PgPool, board_id: Uuid, user_id: Uuid) -> ApiResult<bool> {
    let row: Option<(Uuid,)> = sqlx::query_as(
        "SELECT board_id FROM board_members WHERE board_id = $1 AND user_id = $2",
    )
    .bind(board_id).bind(user_id).fetch_optional(pool).await?;
    Ok(row.is_some())
}

pub async fn members(pool: &PgPool, board_id: Uuid) -> ApiResult<Vec<Uuid>> {
    let rows: Vec<(Uuid,)> = sqlx::query_as(
        "SELECT user_id FROM board_members WHERE board_id = $1",
    )
    .bind(board_id).fetch_all(pool).await?;
    Ok(rows.into_iter().map(|(u,)| u).collect())
}

pub async fn add_member(pool: &PgPool, board_id: Uuid, owner_id: Uuid, user_id: Uuid) -> ApiResult<()> {
    let owns: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM boards WHERE id = $1 AND owner_id = $2")
        .bind(board_id).bind(owner_id).fetch_optional(pool).await?;
    if owns.is_none() { return Err(ApiError::NotFound); }
    sqlx::query("INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING")
        .bind(board_id).bind(user_id).execute(pool).await?;
    Ok(())
}

pub async fn remove_member(pool: &PgPool, board_id: Uuid, owner_id: Uuid, user_id: Uuid) -> ApiResult<()> {
    let owns: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM boards WHERE id = $1 AND owner_id = $2")
        .bind(board_id).bind(owner_id).fetch_optional(pool).await?;
    if owns.is_none() { return Err(ApiError::NotFound); }
    sqlx::query("DELETE FROM board_members WHERE board_id = $1 AND user_id = $2 AND role <> 'owner'")
        .bind(board_id).bind(user_id).execute(pool).await?;
    Ok(())
}

pub async fn resolve_member_id(pool: &PgPool, user_id: Option<Uuid>, email: Option<&str>) -> ApiResult<Uuid> {
    if let Some(id) = user_id { return Ok(id); }
    let email = email.ok_or(ApiError::NotFound)?;
    let row: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM users WHERE LOWER(email) = LOWER($1)")
        .bind(email).fetch_optional(pool).await?;
    row.map(|(u,)| u).ok_or(ApiError::NotFound)
}
