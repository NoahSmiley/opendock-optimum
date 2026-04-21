use crate::auth::extract::AuthUser;
use crate::db::{entity_link, note};
use crate::dto::entity_link::{EntityKind, EntityRef};
use crate::dto::note::{CreateNote, Note, UpdateNote};
use crate::error::ApiResult;
use crate::live::events::{LiveEvent, Room};
use crate::mention;
use crate::routes::entity_links::publish_link_change;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::{delete, get};
use axum::Router;
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/notes", get(list).post(create))
        .route("/notes/{id}", delete(remove).patch(update))
        .with_state(state)
}

async fn list(State(s): State<AppState>, user: AuthUser) -> ApiResult<Json<Vec<Note>>> {
    Ok(Json(note::list_for_user(&s.pool, user.0.id).await?))
}

async fn create(State(s): State<AppState>, user: AuthUser, Json(body): Json<CreateNote>) -> ApiResult<(StatusCode, Json<Note>)> {
    Ok((StatusCode::CREATED, Json(note::create(&s.pool, user.0.id, body).await?)))
}

async fn update(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<UpdateNote>) -> ApiResult<Json<Note>> {
    let content_update = body.content.clone();
    let n = note::update(&s.pool, id, user.0.id, body).await?;
    if let Some(html) = content_update {
        sync_mentions(&s, EntityRef { kind: EntityKind::Note, id }, user.0.id, &html).await?;
    }
    let patch = serde_json::to_value(&n).unwrap_or_default();
    s.hub.publish(Room::Note { id }, LiveEvent::NoteUpdated { note_id: id, actor_id: user.0.id, patch });
    Ok(Json(n))
}

/// Reconcile source='mention' links for this note with the mentions found
/// in the new content. Adds/removes rows and broadcasts EntityLinkChanged
/// events. Silently skips mentions pointing at entities the author lacks
/// access to (e.g. a shared note author pasting a pill for a card they
/// can't see).
async fn sync_mentions(s: &AppState, anchor: EntityRef, actor: Uuid, html: &str) -> ApiResult<()> {
    let desired = mention::extract(html);
    let existing = entity_link::mention_links_for(&s.pool, anchor).await?;
    let desired_set: std::collections::HashSet<(EntityKind, Uuid)> =
        desired.iter().map(|r| (r.kind, r.id)).collect();
    let existing_set: std::collections::HashSet<(EntityKind, Uuid)> =
        existing.iter().map(|r| (r.kind, r.id)).collect();
    for r in &desired {
        if existing_set.contains(&(r.kind, r.id)) { continue; }
        if !entity_link::user_can_access(&s.pool, *r, actor).await? { continue; }
        entity_link::attach(&s.pool, anchor, *r, actor, "mention").await?;
        publish_link_change(s, anchor, *r, true, actor).await?;
    }
    for r in &existing {
        if desired_set.contains(&(r.kind, r.id)) { continue; }
        entity_link::detach(&s.pool, anchor, *r).await?;
        publish_link_change(s, anchor, *r, false, actor).await?;
    }
    Ok(())
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<StatusCode> {
    note::delete(&s.pool, id, user.0.id).await?;
    entity_link::cascade_delete(&s.pool, EntityRef { kind: EntityKind::Note, id }).await?;
    s.hub.publish(Room::Note { id }, LiveEvent::NoteDeleted { note_id: id, actor_id: user.0.id });
    Ok(StatusCode::NO_CONTENT)
}
