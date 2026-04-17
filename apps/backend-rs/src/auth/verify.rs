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
