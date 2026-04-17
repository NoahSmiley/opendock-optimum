use crate::auth::extract::AuthUser;
use crate::db::note_member;
use crate::dto::note::{AddNoteMember, NoteMember};
use crate::error::ApiResult;
use crate::live::events::{LiveEvent, Room};
use crate::live::membership::note_member_ids;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Json;
use axum::routing::{delete, get};
use axum::Router;
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/notes/{id}/members", get(list).post(add))
        .route("/notes/{id}/members/{user_id}", delete(remove))
        .with_state(state)
}

async fn list(State(s): State<AppState>, _u: AuthUser, Path(id): Path<Uuid>) -> ApiResult<Json<Vec<NoteMember>>> {
    Ok(Json(note_member::list(&s.pool, id).await?))
}

async fn add(State(s): State<AppState>, u: AuthUser, Path(id): Path<Uuid>, Json(body): Json<AddNoteMember>) -> ApiResult<StatusCode> {
    let role = body.role.as_deref().unwrap_or("editor");
    let added_user = note_member::add(&s.pool, id, u.0.id, &body.email, role).await?;
    s.hub.publish(Room::Note { id }, LiveEvent::NoteMembersChanged { note_id: id, actor_id: u.0.id });
    for member_id in note_member_ids(&s.pool, id).await? {
        s.hub.publish(Room::User { id: member_id }, LiveEvent::NoteShareAdded { note_id: id, actor_id: u.0.id });
    }
    let _ = added_user;
    Ok(StatusCode::NO_CONTENT)
}

async fn remove(State(s): State<AppState>, u: AuthUser, Path((id, user_id)): Path<(Uuid, Uuid)>) -> ApiResult<StatusCode> {
    note_member::remove(&s.pool, id, u.0.id, user_id).await?;
    s.hub.publish(Room::Note { id }, LiveEvent::NoteMembersChanged { note_id: id, actor_id: u.0.id });
    s.hub.publish(Room::User { id: user_id }, LiveEvent::NoteShareRemoved { note_id: id, actor_id: u.0.id });
    for member_id in note_member_ids(&s.pool, id).await? {
        s.hub.publish(Room::User { id: member_id }, LiveEvent::NoteShareRemoved { note_id: id, actor_id: u.0.id });
    }
    Ok(StatusCode::NO_CONTENT)
}
