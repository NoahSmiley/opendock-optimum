use crate::auth::extract::AuthUser;
use crate::error::ApiResult;
use crate::state::AppState;
use axum::response::Json;
use axum::routing::get;
use axum::Router;
use serde_json::{json, Value};

pub fn router(state: AppState) -> Router {
    Router::new().route("/me", get(me)).with_state(state)
}

async fn me(user: AuthUser) -> ApiResult<Json<Value>> {
    let u = user.0;
    Ok(Json(json!({
        "id": u.id,
        "email": u.email,
        "display_name": u.display_name,
        "avatar_url": u.avatar_url,
    })))
}
