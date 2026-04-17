use crate::auth::extract::AuthUser;
use crate::db::{board, card};
use crate::dto::board::{Card, CreateCard, UpdateCard};
use crate::error::{ApiError, ApiResult};
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::post;
use axum::Router;
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/boards/{id}/cards", post(create))
        .route("/boards/{id}/cards/{card_id}", axum::routing::patch(update).delete(remove))
        .with_state(state)
}

async fn create(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<CreateCard>) -> ApiResult<(StatusCode, Json<Card>)> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    Ok((StatusCode::CREATED, Json(card::create(&s.pool, id, body).await?)))
}

async fn update(State(s): State<AppState>, user: AuthUser, Path((id, card_id)): Path<(Uuid, Uuid)>, Json(body): Json<UpdateCard>) -> ApiResult<Json<Card>> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    Ok(Json(card::update(&s.pool, card_id, id, body).await?))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path((id, card_id)): Path<(Uuid, Uuid)>) -> ApiResult<StatusCode> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    card::delete(&s.pool, card_id, id).await?;
    Ok(StatusCode::NO_CONTENT)
}
