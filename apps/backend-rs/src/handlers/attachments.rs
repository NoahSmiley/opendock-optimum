use axum::extract::{FromRequest, Multipart, Path, Request, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::attachment::Attachment;

pub async fn upload_attachments(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    req: Request,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let auth = req.extensions().get::<AuthUser>().cloned();
    let user_id = auth.map(|a| a.0.id).unwrap_or_else(|| "default-user".into());
    let mut multipart = Multipart::from_request(req, &state)
        .await
        .map_err(|e| AppError::bad_request("UPLOAD_FAILED", &e.to_string()))?;
    let mut attachments: Vec<Attachment> = Vec::new();
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        AppError::bad_request("UPLOAD_FAILED", &e.to_string())
    })? {
        let original_name = field.file_name().unwrap_or("file").to_string();
        let mime = field.content_type().unwrap_or("application/octet-stream").to_string();
        let data = field.bytes().await.map_err(|e| {
            AppError::bad_request("UPLOAD_FAILED", &e.to_string())
        })?;
        let size = data.len() as i64;
        let (filename, url) = crate::uploads::storage::save_file(
            &state.config.uploads_dir, &original_name, &data,
        ).await.map_err(|e| AppError::internal(&e.to_string()))?;
        let row = crate::db::attachments::create_attachment(
            &state.db, &ticket_id, &user_id, &filename, &original_name, &mime, size, &url,
        ).await?;
        attachments.push(row.into());
    }
    Ok((StatusCode::CREATED, Json(json!({ "attachments": attachments }))))
}

pub async fn list_attachments(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let rows = crate::db::attachments::list_by_ticket(&state.db, &ticket_id).await?;
    let attachments: Vec<Attachment> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "attachments": attachments })))
}

pub async fn delete_attachment(
    State(state): State<AppState>,
    Path(attachment_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::services::attachments::delete_attachment(&state.db, &state.config.uploads_dir, &attachment_id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Attachment not found."));
    }
    Ok(Json(json!({ "ok": true })))
}
