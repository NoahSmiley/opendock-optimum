use crate::dto::note::{CreateNote, Note, UpdateNote};
use crate::error::{ApiError, ApiResult};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_for_user(pool: &PgPool, user_id: Uuid) -> ApiResult<Vec<Note>> {
    let rows = sqlx::query_as::<_, Note>(
        "SELECT n.* FROM notes n
         JOIN note_members m ON m.note_id = n.id
         WHERE m.user_id = $1
         ORDER BY n.pinned DESC, n.updated_at DESC",
    )
    .bind(user_id).fetch_all(pool).await?;
    Ok(rows)
}

pub async fn create(pool: &PgPool, owner_id: Uuid, input: CreateNote) -> ApiResult<Note> {
    let id = Uuid::new_v4();
    let row = sqlx::query_as::<_, Note>(
        "INSERT INTO notes (id, owner_id, title, content, pinned)
         VALUES ($1, $2, $3, $4, $5) RETURNING *",
    )
    .bind(id).bind(owner_id)
    .bind(input.title.unwrap_or_default())
    .bind(input.content.unwrap_or_default())
    .bind(input.pinned.unwrap_or(false))
    .fetch_one(pool).await?;
    sqlx::query("INSERT INTO note_members (note_id, user_id, role) VALUES ($1, $2, 'owner')")
        .bind(id).bind(owner_id).execute(pool).await?;
    Ok(row)
}

pub async fn update(pool: &PgPool, id: Uuid, user_id: Uuid, input: UpdateNote) -> ApiResult<Note> {
    sqlx::query_as::<_, Note>(
        "UPDATE notes SET
           title = COALESCE($3, title),
           content = COALESCE($4, content),
           pinned = COALESCE($5, pinned),
           updated_at = NOW()
         WHERE id = $1
           AND EXISTS (SELECT 1 FROM note_members m
                       WHERE m.note_id = $1 AND m.user_id = $2
                         AND m.role IN ('owner', 'editor'))
         RETURNING *",
    )
    .bind(id).bind(user_id)
    .bind(input.title).bind(input.content).bind(input.pinned)
    .fetch_optional(pool).await?
    .ok_or(ApiError::NotFound)
}

pub async fn delete(pool: &PgPool, id: Uuid, owner_id: Uuid) -> ApiResult<()> {
    let res = sqlx::query("DELETE FROM notes WHERE id = $1 AND owner_id = $2")
        .bind(id).bind(owner_id).execute(pool).await?;
    if res.rows_affected() == 0 { return Err(ApiError::NotFound); }
    Ok(())
}
