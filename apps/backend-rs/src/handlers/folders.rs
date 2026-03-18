use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::folder::{CreateFolderReq, UpdateFolderReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::folder::Folder;

pub async fn list_folders(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = crate::db::folders::list_folders(&state.db).await?;
    let folders: Vec<Folder> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "folders": folders })))
}

pub async fn create_folder(
    State(state): State<AppState>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateFolderReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let row = crate::db::folders::create_folder(
        &state.db, &body.name, body.color.as_deref(),
        body.icon.as_deref(), body.parent_id.as_deref(), "default-user",
    ).await?;
    Ok((StatusCode::CREATED, Json(json!({ "folder": Folder::from(row) }))))
}

pub async fn update_folder(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateFolderReq>,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::folders::update_folder(
        &state.db, &id, body.name.as_deref(),
        body.color.as_ref().map(|o| o.as_deref()),
        body.icon.as_ref().map(|o| o.as_deref()),
        body.parent_id.as_ref().map(|o| o.as_deref()),
    )
    .await?
    .ok_or_else(|| AppError::not_found("NOT_FOUND", "Folder not found"))?;
    Ok(Json(json!({ "folder": Folder::from(row) })))
}

pub async fn delete_folder(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::folders::delete_folder(&state.db, &id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Folder not found"));
    }
    Ok(Json(json!({ "ok": true })))
}
