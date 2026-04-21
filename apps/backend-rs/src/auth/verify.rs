use crate::error::{ApiError, ApiResult};
use crate::state::AppState;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize, Clone)]
pub struct AthionUser {
    pub id: Uuid,
    pub email: String,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

pub async fn verify_token(state: &AppState, token: &str) -> ApiResult<AthionUser> {
    if let Some(user) = try_dev_bypass(state, token).await? { return Ok(user); }
    let resp = state
        .http
        .get(&state.athion_verify_url)
        .bearer_auth(token)
        .send()
        .await?;
    if resp.status() == 401 { return Err(ApiError::Unauthorized); }
    if !resp.status().is_success() {
        tracing::warn!(status = %resp.status(), "athion verify non-success");
        return Err(ApiError::Unauthorized);
    }
    let user: AthionUser = resp.json().await?;
    Ok(user)
}

/// Dev-only shortcut: if the backend was started with `DEV_BYPASS_USER_ID`
/// set and the incoming token is `dev:<that-uuid>`, load that user from the
/// DB and skip Athion verification. Unset the env var in production.
async fn try_dev_bypass(state: &AppState, token: &str) -> ApiResult<Option<AthionUser>> {
    let Some(allowed) = state.dev_bypass_user else { return Ok(None); };
    let Some(rest) = token.strip_prefix("dev:") else { return Ok(None); };
    let Ok(id) = rest.parse::<Uuid>() else { return Err(ApiError::Unauthorized); };
    if id != allowed { return Err(ApiError::Unauthorized); }
    let row: Option<(Uuid, String, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT id, email, display_name, avatar_url FROM users WHERE id = $1",
    )
    .bind(id).fetch_optional(&state.pool).await?;
    let Some((id, email, display_name, avatar_url)) = row else { return Err(ApiError::Unauthorized); };
    tracing::warn!(%id, %email, "dev bypass authentication");
    Ok(Some(AthionUser { id, email, display_name, avatar_url }))
}
