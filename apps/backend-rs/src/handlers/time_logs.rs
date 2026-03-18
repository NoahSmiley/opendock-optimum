use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::time_log::{CreateTimeLogReq, StopTimeLogReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::time_log::TimeLog;

pub async fn start_time_log(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateTimeLogReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let log = crate::services::time_logs::start(
        &state.db, &ticket_id, &auth.0.id,
        body.started_at.as_deref(), body.description.as_deref(),
    ).await?;
    Ok((StatusCode::CREATED, Json(json!({ "timeLog": log }))))
}

pub async fn stop_time_log(
    State(state): State<AppState>,
    Path((_ticket_id, log_id)): Path<(String, String)>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<StopTimeLogReq>,
) -> Result<Json<Value>, AppError> {
    let log = crate::services::time_logs::stop(&state.db, &log_id, body.ended_at.as_deref())
        .await?
        .ok_or_else(|| AppError::not_found("TIME_LOG_NOT_FOUND", "Time log not found."))?;
    Ok(Json(json!({ "timeLog": log })))
}

pub async fn get_active(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::time_logs::get_active(&state.db, &ticket_id, &auth.0.id).await?;
    let log: Option<TimeLog> = row.map(Into::into);
    Ok(Json(json!({ "timeLog": log })))
}

pub async fn list_time_logs(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let rows = crate::db::time_logs::list_by_ticket(&state.db, &ticket_id).await?;
    let logs: Vec<TimeLog> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "timeLogs": logs })))
}

pub async fn delete_time_log(
    State(state): State<AppState>,
    Path(log_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::time_logs::delete_time_log(&state.db, &log_id).await? {
        return Err(AppError::not_found("TIME_LOG_NOT_FOUND", "Time log not found."));
    }
    Ok(Json(json!({ "ok": true })))
}
