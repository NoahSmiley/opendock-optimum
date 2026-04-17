use crate::auth::verify::{verify_token, AthionUser};
use crate::db::user::upsert_user;
use crate::error::{ApiError, ApiResult};
use crate::state::AppState;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;

pub struct AuthUser(pub AthionUser);

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> ApiResult<Self> {
        let header = parts.headers.get("authorization").ok_or(ApiError::Unauthorized)?;
        let header = header.to_str().map_err(|_| ApiError::Unauthorized)?;
        let token = header.strip_prefix("Bearer ").ok_or(ApiError::Unauthorized)?;
        let user = verify_token(state, token).await?;
        upsert_user(&state.pool, &user).await?;
        Ok(AuthUser(user))
    }
}
