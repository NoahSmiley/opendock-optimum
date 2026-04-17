use crate::auth::verify::AthionUser;
use crate::error::ApiResult;
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct UserSummary {
    pub id: Uuid,
    pub email: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

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
    .bind(u.id).bind(&u.email).bind(&u.display_name).bind(&u.avatar_url)
    .execute(pool).await?;
    Ok(())
}

pub async fn search(pool: &PgPool, query: &str, limit: i64) -> ApiResult<Vec<UserSummary>> {
    let pattern = format!("{}%", query.to_lowercase());
    let rows = sqlx::query_as::<_, UserSummary>(
        "SELECT id, email, display_name, avatar_url FROM users
         WHERE LOWER(email) LIKE $1 ORDER BY email ASC LIMIT $2",
    )
    .bind(pattern).bind(limit).fetch_all(pool).await?;
    Ok(rows)
}
