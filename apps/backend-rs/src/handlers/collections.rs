use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::collection::{CreateCollectionReq, UpdateCollectionReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::collection::Collection;
use crate::services;

pub async fn list_collections(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let collections = services::collections::list_with_counts(&state.db).await?;
    Ok(Json(json!({ "collections": collections })))
}

pub async fn get_collection(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let collection = services::collections::get_with_count(&state.db, &id)
        .await?
        .ok_or_else(|| AppError::not_found("NOT_FOUND", "Collection not found"))?;
    Ok(Json(json!({ "collection": collection })))
}

pub async fn create_collection(
    State(state): State<AppState>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateCollectionReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let row = crate::db::collections::create_collection(
        &state.db, &body.name, body.description.as_deref(),
        body.color.as_deref(), body.icon.as_deref(), "default-user",
    ).await?;
    let c = Collection {
        id: row.id, name: row.name, description: row.description,
        color: row.color, icon: row.icon, user_id: row.user_id,
        created_at: row.created_at, updated_at: row.updated_at, note_count: Some(0),
    };
    Ok((StatusCode::CREATED, Json(json!({ "collection": c }))))
}

pub async fn update_collection(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateCollectionReq>,
) -> Result<Json<Value>, AppError> {
    let _row = crate::db::collections::update_collection(
        &state.db, &id, body.name.as_deref(),
        body.description.as_ref().map(|o| o.as_deref()),
        body.color.as_ref().map(|o| o.as_deref()),
        body.icon.as_ref().map(|o| o.as_deref()),
    )
    .await?
    .ok_or_else(|| AppError::not_found("NOT_FOUND", "Collection not found"))?;
    let c = services::collections::get_with_count(&state.db, &id).await?.unwrap();
    Ok(Json(json!({ "collection": c })))
}

pub async fn delete_collection(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::collections::delete_collection(&state.db, &id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Collection not found"));
    }
    Ok(Json(json!({ "ok": true })))
}

pub async fn get_collection_notes(
    State(state): State<AppState>,
    Path(collection_id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let rows = crate::db::collections::get_notes_in_collection(&state.db, &collection_id).await?;
    let notes: Vec<_> = rows.into_iter().map(services::notes::row_to_note).collect();
    Ok(Json(json!({ "notes": notes })))
}

pub async fn add_note_to_collection(
    State(state): State<AppState>,
    Path((collection_id, note_id)): Path<(String, String)>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::collections::add_note(&state.db, &collection_id, &note_id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Failed to add note to collection"));
    }
    Ok(Json(json!({ "ok": true })))
}

pub async fn remove_note_from_collection(
    State(state): State<AppState>,
    Path((collection_id, note_id)): Path<(String, String)>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::collections::remove_note(&state.db, &collection_id, &note_id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Failed to remove note from collection"));
    }
    Ok(Json(json!({ "ok": true })))
}
