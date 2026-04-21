use crate::auth::extract::AuthUser;
use crate::db::entity_link;
use crate::dto::entity_link::{CreateLink, EntityKind, EntityLink, EntityRef, LinkedEntity};
use crate::error::{ApiError, ApiResult};
use crate::live::events::{LiveEvent, Room};
use crate::state::AppState;
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::{delete, post};
use axum::Router;
use serde::Deserialize;
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/links", post(create).get(list))
        .route("/links", delete(remove))
        .with_state(state)
}

#[derive(Debug, Deserialize)]
struct ListQuery { kind: EntityKind, id: Uuid }

#[derive(Debug, Deserialize)]
struct RemoveQuery { a_kind: EntityKind, a_id: Uuid, b_kind: EntityKind, b_id: Uuid }

async fn create(State(s): State<AppState>, user: AuthUser, Json(body): Json<CreateLink>) -> ApiResult<(StatusCode, Json<EntityLink>)> {
    let (a, b) = (body.a, body.b);
    if !entity_link::user_can_access(&s.pool, a, user.0.id).await? { return Err(ApiError::NotFound); }
    if !entity_link::user_can_access(&s.pool, b, user.0.id).await? { return Err(ApiError::NotFound); }
    let source = body.source.unwrap_or_else(|| "manual".into());
    let row = entity_link::attach(&s.pool, a, b, user.0.id, &source).await?;
    publish_link_change(&s, a, b, true, user.0.id).await?;
    Ok((StatusCode::CREATED, Json(row)))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Query(q): Query<RemoveQuery>) -> ApiResult<StatusCode> {
    let a = EntityRef { kind: q.a_kind, id: q.a_id };
    let b = EntityRef { kind: q.b_kind, id: q.b_id };
    if !entity_link::user_can_access(&s.pool, a, user.0.id).await? { return Err(ApiError::NotFound); }
    if !entity_link::user_can_access(&s.pool, b, user.0.id).await? { return Err(ApiError::NotFound); }
    let removed = entity_link::detach(&s.pool, a, b).await?;
    if !removed { return Err(ApiError::NotFound); }
    publish_link_change(&s, a, b, false, user.0.id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn list(State(s): State<AppState>, user: AuthUser, Query(q): Query<ListQuery>) -> ApiResult<Json<Vec<LinkedEntity>>> {
    let anchor = EntityRef { kind: q.kind, id: q.id };
    if !entity_link::user_can_access(&s.pool, anchor, user.0.id).await? { return Err(ApiError::NotFound); }
    let rows = match q.kind {
        EntityKind::Card => entity_link::notes_for_card(&s.pool, q.id, user.0.id).await?,
        EntityKind::Note => entity_link::cards_for_note(&s.pool, q.id, user.0.id).await?,
    };
    Ok(Json(rows))
}

async fn publish_link_change(s: &AppState, a: EntityRef, b: EntityRef, added: bool, actor_id: Uuid) -> ApiResult<()> {
    let ev = LiveEvent::EntityLinkChanged {
        a_kind: kind_str(a.kind).into(), a_id: a.id,
        b_kind: kind_str(b.kind).into(), b_id: b.id,
        added, actor_id,
    };
    publish_for(s, a, ev.clone()).await?;
    publish_for(s, b, ev).await?;
    Ok(())
}

async fn publish_for(s: &AppState, r: EntityRef, ev: LiveEvent) -> ApiResult<()> {
    match r.kind {
        EntityKind::Note => s.hub.publish(Room::Note { id: r.id }, ev),
        EntityKind::Card => {
            let board_id = entity_link::card_board_id(&s.pool, r.id).await?;
            s.hub.publish(Room::Board { id: board_id }, ev);
        }
    }
    Ok(())
}

fn kind_str(k: EntityKind) -> &'static str {
    match k { EntityKind::Card => "card", EntityKind::Note => "note" }
}
