use crate::auth::extract::AuthUser;
use crate::db::note;
use crate::dto::note::{CreateNote, Note, UpdateNote};
use crate::error::ApiResult;
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
    let n = note::create(&s.pool, user.0.id, body).await?;
    Ok((StatusCode::CREATED, Json(n)))
}

async fn update(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>, Json(body): Json<UpdateNote>) -> ApiResult<Json<Note>> {
    Ok(Json(note::update(&s.pool, id, user.0.id, body).await?))
}

async fn remove(State(s): State<AppState>, user: AuthUser, Path(id): Path<Uuid>) -> ApiResult<StatusCode> {
    note::delete(&s.pool, id, user.0.id).await?;
    Ok(StatusCode::NO_CONTENT)
}
