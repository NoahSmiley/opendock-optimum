use crate::auth::extract::AuthUser;
use crate::db::{board, card, entity_link};
use crate::dto::board::{Card, CreateCard, UpdateCard};
use crate::dto::entity_link::{EntityKind, EntityRef};
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
        .route("/boards/{id}/cards", post(create))
        .route("/boards/{id}/cards/{card_id}", axum::routing::patch(update).delete(remove))
        .with_state(state)
}

async fn create(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<CreateCard>) -> ApiResult<(StatusCode, Json<Card>)> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    let c = card::create(&s.pool, id, body).await?;
    broadcast_upsert(&s, id, user.0.id, &c);
    Ok((StatusCode::CREATED, Json(c)))
}

async fn update(State(s): State<AppState>, user: AuthUser, Path((id, card_id)): Path<(Uuid, Uuid)>, Json(body): Json<UpdateCard>) -> ApiResult<Json<Card>> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    let c = card::update(&s.pool, card_id, id, body).await?;
    broadcast_upsert(&s, id, user.0.id, &c);
    Ok(Json(c))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path((id, card_id)): Path<(Uuid, Uuid)>) -> ApiResult<StatusCode> {
    if !board::is_member(&s.pool, id, user.0.id).await? { return Err(ApiError::NotFound); }
    card::delete(&s.pool, card_id, id).await?;
    entity_link::cascade_delete(&s.pool, EntityRef { kind: EntityKind::Card, id: card_id }).await?;
    s.hub.publish(Room::Board { id }, LiveEvent::CardDeleted { board_id: id, card_id, actor_id: user.0.id });
    Ok(StatusCode::NO_CONTENT)
}

fn broadcast_upsert(s: &AppState, board_id: Uuid, actor_id: Uuid, card: &Card) {
    let value = serde_json::to_value(card).unwrap_or_default();
    s.hub.publish(Room::Board { id: board_id }, LiveEvent::CardUpserted { board_id, actor_id, card: value });
}
