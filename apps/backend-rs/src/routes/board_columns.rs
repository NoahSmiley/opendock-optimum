use crate::auth::extract::AuthUser;
use crate::db::{board, column};
use crate::dto::board::{Column, CreateColumn};
use crate::error::{ApiError, ApiResult};
use crate::live::events::{LiveEvent, Room};
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::post;
use axum::Router;
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/boards/{id}/columns", post(create))
        .route("/boards/{id}/columns/{column_id}", axum::routing::delete(remove))
        .with_state(state)
}

async fn create(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<CreateColumn>) -> ApiResult<(StatusCode, Json<Column>)> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    let c = column::create(&s.pool, id, body).await?;
    let patch = serde_json::json!({"column": c});
    s.hub.publish(Room::Board { id }, LiveEvent::BoardUpdated { board_id: id, actor_id: user.0.id, patch });
    Ok((StatusCode::CREATED, Json(c)))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path((id, column_id)): Path<(Uuid, Uuid)>) -> ApiResult<StatusCode> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    column::delete(&s.pool, column_id, id).await?;
    let patch = serde_json::json!({"removed_column_id": column_id});
    s.hub.publish(Room::Board { id }, LiveEvent::BoardUpdated { board_id: id, actor_id: user.0.id, patch });
    Ok(StatusCode::NO_CONTENT)
}
