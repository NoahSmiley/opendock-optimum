use argon2::{password_hash::SaltString, Argon2, PasswordHasher, PasswordVerifier};
use argon2::password_hash::PasswordHash;
use rand::rngs::OsRng;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::user::PublicUser;

pub async fn register(
    pool: &SqlitePool,
    email: &str,
    password: &str,
    display_name: Option<&str>,
) -> Result<(PublicUser, String), AppError> {
    validate_password(password)?;
    if db::auth::find_by_email(pool, email).await?.is_some() {
        return Err(AppError::conflict("EMAIL_TAKEN", "Email already registered."));
    }
    let hash = hash_password(password)?;
    let user = db::auth::create_user(pool, email, &hash, display_name).await?;
    let token = create_session(pool, &user.id).await?;
    Ok((user.into(), token))
}

pub async fn login(
    pool: &SqlitePool,
    email: &str,
    password: &str,
) -> Result<(PublicUser, String), AppError> {
    let user = db::auth::find_by_email(pool, email)
        .await?
        .ok_or_else(|| {
            AppError::new(
                axum::http::StatusCode::UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Invalid email or password.",
            )
        })?;
    verify_password(password, &user.password_hash)?;
    let token = create_session(pool, &user.id).await?;
    Ok((user.into(), token))
}

pub async fn logout(pool: &SqlitePool, session_token: &str) -> Result<(), AppError> {
    let hash = hex::encode(Sha256::digest(session_token.as_bytes()));
    db::auth::delete_session(pool, &hash).await?;
    Ok(())
}

async fn create_session(pool: &SqlitePool, user_id: &str) -> Result<String, AppError> {
    let token = hex::encode(rand::random::<[u8; 32]>());
    let hash = hex::encode(Sha256::digest(token.as_bytes()));
    let expires = (chrono::Utc::now() + chrono::Duration::days(30))
        .to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    db::auth::create_session(pool, user_id, &hash, "", "", &expires).await?;
    Ok(token)
}

fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|_| AppError::internal("Failed to hash password."))
}

fn verify_password(password: &str, hash: &str) -> Result<(), AppError> {
    let parsed = PasswordHash::new(hash)
        .map_err(|_| AppError::internal("Invalid password hash."))?;
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .map_err(|_| {
            AppError::new(
                axum::http::StatusCode::UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                "Invalid email or password.",
            )
        })
}

fn validate_password(password: &str) -> Result<(), AppError> {
    if password.len() < 12 {
        return Err(AppError::bad_request(
            "INVALID_PAYLOAD",
            "Password must be at least 12 characters long.",
        ));
    }
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err(AppError::bad_request(
            "INVALID_PAYLOAD",
            "Password must include at least one uppercase letter.",
        ));
    }
    if !password.chars().any(|c| c.is_lowercase()) {
        return Err(AppError::bad_request(
            "INVALID_PAYLOAD",
            "Password must include at least one lowercase letter.",
        ));
    }
    if !password.chars().any(|c| c.is_ascii_digit()) {
        return Err(AppError::bad_request(
            "INVALID_PAYLOAD",
            "Password must include at least one number.",
        ));
    }
    Ok(())
}
