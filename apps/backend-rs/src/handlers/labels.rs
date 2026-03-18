use axum::extract::{Path, State};
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::label::{CreateLabelReq, UpdateLabelReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::label::Label;

pub async fn list_labels(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let rows = crate::db::labels::list_by_board(&state.db, &board_id).await?;
    let labels: Vec<Label> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "labels": labels })))
}

pub async fn create_label(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateLabelReq>,
) -> Result<Json<Value>, AppError> {
    let label = crate::services::labels::create_label(&state.db, &board_id, &body.name, &body.color).await?;
    Ok(Json(json!({ "label": label })))
}

pub async fn update_label(
    State(state): State<AppState>,
    Path(label_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateLabelReq>,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::labels::update_label(&state.db, &label_id, body.name.as_deref(), body.color.as_deref())
        .await?
        .ok_or_else(|| AppError::not_found("NOT_FOUND", "Label not found."))?;
    let label: Label = row.into();
    Ok(Json(json!({ "label": label })))
}

pub async fn delete_label(
    State(state): State<AppState>,
    Path(label_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::labels::delete_label(&state.db, &label_id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Label not found."));
    }
    Ok(Json(json!({ "ok": true })))
}

pub async fn board_activity(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Value>, AppError> {
    let limit: i64 = params.get("limit").and_then(|l| l.parse().ok()).unwrap_or(50);
    let rows = crate::db::activities::list_by_board(&state.db, &board_id, limit).await?;
    let activities: Vec<_> = rows.into_iter().map(crate::models::activity::Activity::from).collect();
    Ok(Json(json!({ "activities": activities })))
}

pub async fn ticket_activity(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    _auth: AuthUser,
    axum::extract::Query(params): axum::extract::Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Value>, AppError> {
    let limit: i64 = params.get("limit").and_then(|l| l.parse().ok()).unwrap_or(50);
    let rows = crate::db::activities::list_by_ticket(&state.db, &ticket_id, limit).await?;
    let activities: Vec<_> = rows.into_iter().map(crate::models::activity::Activity::from).collect();
    Ok(Json(json!({ "activities": activities })))
}
