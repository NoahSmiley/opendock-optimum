use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::column::{CreateColumnReq, UpdateColumnReq};
use crate::dto::ticket::CreateSprintReq;
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::column::Column;

pub async fn create_column(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateColumnReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    if crate::db::boards::get_board(&state.db, &board_id).await?.is_none() {
        return Err(AppError::not_found("BOARD_NOT_FOUND", "Board not found."));
    }
    let col = crate::services::columns::create_column(
        &state.db, &board_id, &body.title, body.order,
    ).await?;
    state.event_bus.broadcast(crate::sse::KanbanEvent::ColumnCreated {
        board_id: board_id.clone(), column_id: col.id.clone(),
    }).await;
    Ok((StatusCode::CREATED, Json(json!({ "column": col }))))
}

pub async fn update_column(
    State(state): State<AppState>,
    Path((board_id, column_id)): Path<(String, String)>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateColumnReq>,
) -> Result<Json<Value>, AppError> {
    let col = crate::db::columns::update_column(
        &state.db, &column_id, body.title.as_deref(),
        body.wip_limit,
    )
    .await?
    .ok_or_else(|| AppError::not_found("COLUMN_NOT_FOUND", "Column not found."))?;
    let col: Column = col.into();
    state.event_bus.broadcast(crate::sse::KanbanEvent::ColumnUpdated {
        board_id, column_id: col.id.clone(),
    }).await;
    Ok(Json(json!({ "column": col })))
}

pub async fn delete_column(
    State(state): State<AppState>,
    Path((board_id, column_id)): Path<(String, String)>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::columns::delete_column(&state.db, &column_id).await? {
        return Err(AppError::not_found("COLUMN_NOT_FOUND", "Column not found."));
    }
    state.event_bus.broadcast(crate::sse::KanbanEvent::ColumnDeleted {
        board_id, column_id,
    }).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn create_sprint(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateSprintReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    if crate::db::boards::get_board(&state.db, &board_id).await?.is_none() {
        return Err(AppError::not_found("BOARD_NOT_FOUND", "Board not found."));
    }
    let status = body.status.as_deref().unwrap_or("planned");
    let row = crate::db::sprints::create_sprint(
        &state.db, &board_id, &body.name, body.goal.as_deref(),
        &body.start_date, &body.end_date, status,
    ).await?;
    let sprint: crate::models::sprint::Sprint = row.into();
    state.event_bus.broadcast(crate::sse::KanbanEvent::SprintCreated {
        board_id, sprint_id: sprint.id.clone(),
    }).await;
    Ok((StatusCode::CREATED, Json(json!({ "sprint": sprint }))))
}
