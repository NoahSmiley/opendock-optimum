use crate::dto::note::NoteMember;
use crate::error::{ApiError, ApiResult};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list(pool: &PgPool, note_id: Uuid) -> ApiResult<Vec<NoteMember>> {
    let rows = sqlx::query_as::<_, NoteMember>(
        "SELECT m.user_id, u.email, u.display_name, m.role::text
         FROM note_members m
         JOIN users u ON u.id = m.user_id
         WHERE m.note_id = $1
         ORDER BY m.role = 'owner' DESC, u.email ASC",
    )
    .bind(note_id).fetch_all(pool).await?;
    Ok(rows)
}

pub async fn add(pool: &PgPool, note_id: Uuid, owner_id: Uuid, email: &str, role: &str) -> ApiResult<Uuid> {
    let owns: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM notes WHERE id = $1 AND owner_id = $2")
        .bind(note_id).bind(owner_id).fetch_optional(pool).await?;
    if owns.is_none() { return Err(ApiError::NotFound); }
    let user: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM users WHERE LOWER(email) = LOWER($1)")
        .bind(email).fetch_optional(pool).await?;
    let (user_id,) = user.ok_or(ApiError::NotFound)?;
    sqlx::query("INSERT INTO note_members (note_id, user_id, role) VALUES ($1, $2, $3::note_role)
                 ON CONFLICT (note_id, user_id) DO UPDATE SET role = EXCLUDED.role")
        .bind(note_id).bind(user_id).bind(role).execute(pool).await?;
    Ok(user_id)
}

pub async fn remove(pool: &PgPool, note_id: Uuid, owner_id: Uuid, user_id: Uuid) -> ApiResult<()> {
    let owns: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM notes WHERE id = $1 AND owner_id = $2")
        .bind(note_id).bind(owner_id).fetch_optional(pool).await?;
    if owns.is_none() { return Err(ApiError::NotFound); }
    sqlx::query("DELETE FROM note_members WHERE note_id = $1 AND user_id = $2 AND role <> 'owner'")
        .bind(note_id).bind(user_id).execute(pool).await?;
    Ok(())
}
