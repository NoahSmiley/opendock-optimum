use crate::auth::extract::AuthUser;
use crate::db::{board, card, column};
use crate::dto::board::{AddBoardMember, Board, BoardDetail, BoardMember, CreateBoard, UpdateBoard};
use crate::error::{ApiError, ApiResult};
use crate::live::events::{LiveEvent, Room};
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::{delete, get};
use axum::Router;
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
    let b = boards.into_iter().find(|b| b.id == id).ok_or(ApiError::NotFound)?;
    Ok(Json(BoardDetail {
        board: b,
        columns: column::list_for_board(&s.pool, id).await?,
        cards: card::list_for_board(&s.pool, id).await?,
        members: board::members(&s.pool, id).await?,
    }))
}

async fn update(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<UpdateBoard>) -> ApiResult<Json<Board>> {
    let b = board::update(&s.pool, id, user.0.id, body).await?;
    let patch = serde_json::to_value(&b).unwrap_or_default();
    s.hub.publish(Room::Board { id }, LiveEvent::BoardUpdated { board_id: id, actor_id: user.0.id, patch });
    Ok(Json(b))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<StatusCode> {
    board::delete(&s.pool, id, user.0.id).await?;
    s.hub.publish(Room::Board { id }, LiveEvent::BoardDeleted { board_id: id, actor_id: user.0.id });
    Ok(StatusCode::NO_CONTENT)
}

async fn list_members(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<Json<Vec<BoardMember>>> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    Ok(Json(board::members(&s.pool, id).await?))
}

async fn add_member(State(s): State<AppState>, u: AuthUser, Path(id): Path<Uuid>, Json(body): Json<AddBoardMember>) -> ApiResult<StatusCode> {
    let target = board::resolve_member_id(&s.pool, body.user_id, body.email.as_deref()).await?;
    board::add_member(&s.pool, id, u.0.id, target).await?;
    let ids = board::member_ids(&s.pool, id).await?;
    notify_board_share(&s, id, u.0.id, target, true, &ids);
    Ok(StatusCode::NO_CONTENT)
}

async fn remove_member(State(s): State<AppState>, u: AuthUser, Path((id, user_id)): Path<(Uuid, Uuid)>) -> ApiResult<StatusCode> {
    board::remove_member(&s.pool, id, u.0.id, user_id).await?;
    let ids = board::member_ids(&s.pool, id).await?;
    notify_board_share(&s, id, u.0.id, user_id, false, &ids);
    Ok(StatusCode::NO_CONTENT)
}

fn notify_board_share(s: &AppState, board_id: Uuid, actor_id: Uuid, target_id: Uuid, added: bool, members: &[Uuid]) {
    s.hub.publish(Room::Board { id: board_id }, LiveEvent::BoardMembersChanged { board_id, actor_id });
    let make = || if added { LiveEvent::BoardShareAdded { board_id, actor_id } } else { LiveEvent::BoardShareRemoved { board_id, actor_id } };
    s.hub.publish(Room::User { id: target_id }, make());
    for m in members { s.hub.publish(Room::User { id: *m }, make()); }
}
