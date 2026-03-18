use axum::extract::{Multipart, Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::file_item::{CreateFileFolderReq, UpdateFileReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::file_folder::FileFolder;
use crate::models::file_item::FileItem;

pub async fn list_files(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = crate::db::file_items::list_files(&state.db).await?;
    let files: Vec<FileItem> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "files": files })))
}

pub async fn upload_file(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let field = multipart.next_field().await
        .map_err(|e| AppError::bad_request("UPLOAD_FAILED", &e.to_string()))?
        .ok_or_else(|| AppError::bad_request("UPLOAD_FAILED", "No file provided"))?;
    let original_name = field.file_name().unwrap_or("file").to_string();
    let mime = field.content_type().unwrap_or("application/octet-stream").to_string();
    let data = field.bytes().await.map_err(|e| AppError::bad_request("UPLOAD_FAILED", &e.to_string()))?;
    let size = data.len() as i64;
    let (_filename, url) = crate::uploads::storage::save_file(
        &state.config.uploads_dir, &original_name, &data,
    ).await.map_err(|e| AppError::internal(&e.to_string()))?;
    let thumb = if mime.starts_with("image/") { Some(url.clone()) } else { None };
    let row = crate::db::file_items::create_file(
        &state.db, &original_name, &mime, size,
        None, &url, thumb.as_deref(), &auth.0.id,
    ).await?;
    Ok((StatusCode::CREATED, Json(serde_json::to_value(FileItem::from(row)).unwrap())))
}

pub async fn update_file(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateFileReq>,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::file_items::update_file(
        &state.db, &id,
        body.folder_id.as_ref().map(|o| o.as_deref()),
        body.name.as_deref(),
    )
    .await?
    .ok_or_else(|| AppError::not_found("NOT_FOUND", "File not found"))?;
    Ok(Json(serde_json::to_value(FileItem::from(row)).unwrap()))
}

pub async fn delete_file(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
) -> Result<StatusCode, AppError> {
    if !crate::services::files::delete_file(&state.db, &state.config.uploads_dir, &id).await? {
        return Err(AppError::not_found("NOT_FOUND", "File not found"));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn list_file_folders(State(state): State<AppState>) -> Result<Json<Value>, AppError> {
    let rows = crate::db::file_folders::list_folders(&state.db).await?;
    let folders: Vec<FileFolder> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "folders": folders })))
}

pub async fn create_file_folder(
    State(state): State<AppState>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateFileFolderReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let row = crate::db::file_folders::create_folder(
        &state.db, &body.name, body.parent_id.as_deref(),
    ).await?;
    Ok((StatusCode::CREATED, Json(serde_json::to_value(FileFolder::from(row)).unwrap())))
}

pub async fn delete_file_folder(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
) -> Result<StatusCode, AppError> {
    if !crate::db::file_folders::delete_folder(&state.db, &id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Folder not found"));
    }
    Ok(StatusCode::NO_CONTENT)
}
