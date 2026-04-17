use crate::auth::verify::AthionUser;
use crate::error::ApiResult;
use sqlx::PgPool;

pub async fn upsert_user(pool: &PgPool, u: &AthionUser) -> ApiResult<()> {
    sqlx::query(
        "INSERT INTO users (id, email, display_name, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           avatar_url = EXCLUDED.avatar_url,
           updated_at = NOW()",
    )
    .bind(u.id)
    .bind(&u.email)
    .bind(&u.display_name)
    .bind(&u.avatar_url)
    .execute(pool)
    .await?;
    Ok(())
}
