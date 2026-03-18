use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::board::{CreateBoardReq, UpdateBoardReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::services;

pub async fn list_boards(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let board_rows = crate::db::boards::list_boards(&state.db).await?;
    let users = crate::db::boards::list_kanban_users(&state.db).await?;
    let mut boards = Vec::new();
    for row in board_rows {
        if let Some(snap) = services::boards::board_snapshot(&state.db, &row.id).await? {
            boards.push(snap.board);
        }
    }
    Ok(Json(json!({ "boards": boards, "users": users })))
}

pub async fn create_board(
    State(state): State<AppState>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateBoardReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let board_id = ulid::Ulid::new().to_string().to_lowercase();
    let mut member_ids: Vec<String> = Vec::new();
    if let Some(members) = &body.members {
        let colors = ["#4f46e5","#dc2626","#059669","#d97706","#7c3aed","#db2777"];
        for (i, m) in members.iter().enumerate() {
            let uid = ulid::Ulid::new().to_string().to_lowercase();
            let color = colors[i % colors.len()];
            crate::db::boards::create_kanban_user(
                &state.db, &uid, &m.name, m.email.as_deref(), color,
            ).await?;
            member_ids.push(uid);
        }
    }
    let ids_json = serde_json::to_string(&member_ids).unwrap_or_else(|_| "[]".into());
    crate::db::boards::create_board(
        &state.db, &board_id, &body.name, body.description.as_deref(),
        body.project_id.as_deref(), &ids_json,
    ).await?;
    // Create default columns
    for (i, title) in ["To Do", "In Progress", "Done"].iter().enumerate() {
        crate::db::columns::create_column(&state.db, &board_id, title, i as i64).await?;
    }
    let snap = services::boards::board_snapshot(&state.db, &board_id)
        .await?
        .ok_or_else(|| AppError::internal("Failed to create board"))?;
    Ok((StatusCode::CREATED, Json(serde_json::to_value(snap).unwrap())))
}

pub async fn get_board(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let snap = services::boards::board_snapshot(&state.db, &board_id)
        .await?
        .ok_or_else(|| AppError::not_found("BOARD_NOT_FOUND", "Board not found."))?;
    Ok(Json(serde_json::to_value(snap).unwrap()))
}

pub async fn delete_board(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
) -> Result<StatusCode, AppError> {
    let deleted = crate::db::boards::delete_board(&state.db, &board_id).await?;
    if !deleted {
        return Err(AppError::not_found("BOARD_NOT_FOUND", "Board not found."));
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn update_board(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateBoardReq>,
) -> Result<Json<Value>, AppError> {
    let _row = crate::db::boards::update_board(
        &state.db,
        &board_id,
        body.name.as_deref(),
        body.description.as_ref().map(|o| o.as_deref()),
        body.project_id.as_ref().map(|o| o.as_deref()),
    )
    .await?
    .ok_or_else(|| AppError::not_found("BOARD_NOT_FOUND", "Board not found."))?;
    let snap = services::boards::board_snapshot(&state.db, &board_id).await?;
    let board = snap.map(|s| s.board);
    Ok(Json(json!({ "board": board })))
}
