use sqlx::SqlitePool;

use crate::models::session::SessionRow;
use crate::models::user::{PublicUser, User};

pub async fn create_user(
    pool: &SqlitePool,
    email: &str,
    password_hash: &str,
    display_name: Option<&str>,
) -> Result<User, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    sqlx::query_as::<_, User>(
        "INSERT INTO users (id, email, password_hash, display_name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'member', ?, ?) RETURNING *",
    )
    .bind(&id)
    .bind(email)
    .bind(password_hash)
    .bind(display_name)
    .bind(&now)
    .bind(&now)
    .fetch_one(pool)
    .await
}

pub async fn find_by_email(pool: &SqlitePool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .fetch_optional(pool)
        .await
}

pub async fn create_session(
    pool: &SqlitePool,
    user_id: &str,
    token_hash: &str,
    user_agent: &str,
    ip_address: &str,
    expires_at: &str,
) -> Result<SessionRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, SessionRow>(
        "INSERT INTO sessions (id, user_id, token_hash, user_agent, ip_address, expires_at)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id)
    .bind(user_id)
    .bind(token_hash)
    .bind(user_agent)
    .bind(ip_address)
    .bind(expires_at)
    .fetch_one(pool)
    .await
}

pub struct SessionWithUser {
    pub user: PublicUser,
    pub expires_at: String,
}

pub async fn find_session_with_user(
    pool: &SqlitePool,
    token_hash: &str,
) -> Result<Option<SessionWithUser>, sqlx::Error> {
    let row = sqlx::query_as::<_, SessionRow>(
        "SELECT * FROM sessions WHERE token_hash = ?",
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await?;

    let session = match row {
        Some(s) => s,
        None => return Ok(None),
    };

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&session.user_id)
        .fetch_optional(pool)
        .await?;

    match user {
        Some(u) => Ok(Some(SessionWithUser {
            expires_at: session.expires_at.clone(),
            user: u.into(),
        })),
        None => Ok(None),
    }
}

pub async fn delete_session(pool: &SqlitePool, token_hash: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE token_hash = ?")
        .bind(token_hash)
        .execute(pool)
        .await?;
    Ok(())
}
