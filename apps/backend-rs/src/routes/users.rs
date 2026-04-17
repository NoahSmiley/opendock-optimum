use crate::auth::extract::AuthUser;
use crate::db::user;
use crate::db::user::UserSummary;
use crate::error::ApiResult;
use crate::state::AppState;
use axum::extract::{Query, State};
use axum::response::Json;
use axum::routing::get;
use axum::Router;
use serde::Deserialize;

const MAX_RESULTS: i64 = 10;

#[derive(Deserialize)]
struct SearchQuery { q: String }

pub fn router(state: AppState) -> Router {
    Router::new().route("/users/search", get(search)).with_state(state)
}

async fn search(State(s): State<AppState>, _user: AuthUser, Query(q): Query<SearchQuery>) -> ApiResult<Json<Vec<UserSummary>>> {
    let trimmed = q.q.trim();
    if trimmed.len() < 2 { return Ok(Json(Vec::new())); }
    Ok(Json(user::search(&s.pool, trimmed, MAX_RESULTS).await?))
}
