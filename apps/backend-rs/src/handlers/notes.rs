use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::note::{CreateNoteReq, UpdateNoteReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::services::notes::row_to_note;

pub async fn list_notes(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = crate::db::notes::list_active(&state.db).await?;
    let notes: Vec<_> = rows.into_iter().map(row_to_note).collect();
    let folder_rows = crate::db::folders::list_folders(&state.db).await?;
    let folders: Vec<crate::models::folder::Folder> = folder_rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "notes": notes, "folders": folders })))
}

pub async fn list_archived(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = crate::db::notes::list_archived(&state.db).await?;
    let notes: Vec<_> = rows.into_iter().map(row_to_note).collect();
    Ok(Json(json!({ "notes": notes })))
}

pub async fn get_tags(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let tags = crate::db::notes::get_all_tags(&state.db).await?;
    Ok(Json(json!({ "tags": tags })))
}

pub async fn get_note(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::notes::get_note(&state.db, &id).await?
        .ok_or_else(|| AppError::not_found("NOT_FOUND", "Note not found"))?;
    Ok(Json(json!({ "note": row_to_note(row) })))
}

pub async fn create_note(
    State(state): State<AppState>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateNoteReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let tags = serde_json::to_string(&body.tags.unwrap_or_default()).unwrap();
    let ct = body.content_type.as_deref().unwrap_or("markdown");
    let row = crate::db::notes::create_note(
        &state.db, &body.title, body.content.as_deref().unwrap_or(""),
        ct, body.folder_id.as_deref(), &tags, body.is_pinned.unwrap_or(false), "default-user",
    ).await?;
    Ok((StatusCode::CREATED, Json(json!({ "note": row_to_note(row) }))))
}

pub async fn update_note(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateNoteReq>,
) -> Result<Json<Value>, AppError> {
    let tags = body.tags.as_ref().map(|t| serde_json::to_string(t).unwrap());
    let row = crate::db::notes::update_note(
        &state.db, &id, body.title.as_deref(), body.content.as_deref(),
        body.content_type.as_deref(),
        body.folder_id.as_ref().map(|o| o.as_deref()),
        tags.as_deref(), body.is_pinned, body.is_archived,
    )
    .await?
    .ok_or_else(|| AppError::not_found("NOT_FOUND", "Note not found"))?;
    Ok(Json(json!({ "note": row_to_note(row) })))
}

pub async fn delete_note(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::notes::delete_note(&state.db, &id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Note not found"));
    }
    Ok(Json(json!({ "ok": true })))
}

pub async fn get_note_collections(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let rows = crate::db::collections::get_collections_for_note(&state.db, &id).await?;
    let collections: Vec<crate::models::collection::Collection> = rows.into_iter().map(|r| {
        crate::models::collection::Collection {
            id: r.id, name: r.name, description: r.description,
            color: r.color, icon: r.icon, user_id: r.user_id,
            created_at: r.created_at, updated_at: r.updated_at,
            note_count: None,
        }
    }).collect();
    Ok(Json(json!({ "collections": collections })))
}
