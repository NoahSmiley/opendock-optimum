use crate::auth::extract::AuthUser;
use crate::db::{board, card, column};
use crate::dto::board::{Board, BoardDetail, CreateBoard, UpdateBoard};
use crate::error::{ApiError, ApiResult};
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::{delete, get};
use axum::Router;
use serde::Deserialize;
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/boards", get(list).post(create))
        .route("/boards/{id}", get(detail).patch(update).delete(remove))
        .route("/boards/{id}/members", get(list_members).post(add_member))
        .route("/boards/{id}/members/{user_id}", delete(remove_member))
        .with_state(state)
}

async fn list(State(s): State<AppState>, user: AuthUser) -> ApiResult<Json<Vec<Board>>> {
    Ok(Json(board::list_for_user(&s.pool, user.0.id).await?))
}

async fn create(State(s): State<AppState>, user: AuthUser, Json(body): Json<CreateBoard>) -> ApiResult<(StatusCode, Json<Board>)> {
    Ok((StatusCode::CREATED, Json(board::create(&s.pool, user.0.id, body).await?)))
}

async fn detail(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<Json<BoardDetail>> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    let boards = board::list_for_user(&s.pool, user.0.id).await?;
    let board = boards.into_iter().find(|b| b.id == id).ok_or(ApiError::NotFound)?;
    Ok(Json(BoardDetail {
        board,
        columns: column::list_for_board(&s.pool, id).await?,
        cards: card::list_for_board(&s.pool, id).await?,
        members: board::members(&s.pool, id).await?,
    }))
}

async fn update(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<UpdateBoard>) -> ApiResult<Json<Board>> {
    Ok(Json(board::update(&s.pool, id, user.0.id, body).await?))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<StatusCode> {
    board::delete(&s.pool, id, user.0.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list_members(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<Json<Vec<Uuid>>> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    Ok(Json(board::members(&s.pool, id).await?))
}

#[derive(Deserialize)]
struct AddMemberBody { user_id: Uuid }

async fn add_member(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<AddMemberBody>) -> ApiResult<StatusCode> {
    board::add_member(&s.pool, id, user.0.id, body.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn remove_member(State(s): State<AppState>, user: AuthUser, Path((id, user_id)): Path<(Uuid, Uuid)>) -> ApiResult<StatusCode> {
    board::remove_member(&s.pool, id, user.0.id, user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
