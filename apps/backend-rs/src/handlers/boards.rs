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
use crate::services::board_repair::{ensure_kanban_user, project_key_from_name, repair_board};

pub async fn list_boards(
    State(state): State<AppState>,
) -> Result<Json<Value>, AppError> {
    let board_rows = crate::db::boards::list_boards(&state.db).await?;
    let users = crate::db::kanban_users::list_all(&state.db).await?;
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
    auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateBoardReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let board_id = ulid::Ulid::new().to_string().to_lowercase();
    let kanban_user = ensure_kanban_user(&state.db, &auth.0).await?;
    let mut member_ids = vec![kanban_user.id];
    if let Some(members) = &body.members {
        let colors = ["#dc2626","#059669","#d97706","#7c3aed","#db2777","#4f46e5"];
        for (i, m) in members.iter().enumerate() {
            let uid = ulid::Ulid::new().to_string().to_lowercase();
            crate::db::kanban_users::create(
                &state.db, &uid, &m.name, m.email.as_deref(), colors[i % colors.len()],
            ).await?;
            member_ids.push(uid);
        }
    }
    let ids_json = serde_json::to_string(&member_ids).unwrap_or_else(|_| "[]".into());
    let project_key = project_key_from_name(&body.name);
    crate::db::boards::create_board(
        &state.db, &board_id, &body.name, body.description.as_deref(),
        body.project_id.as_deref(), &project_key, &ids_json,
    ).await?;
    for (i, title) in ["To Do", "In Progress", "Done"].iter().enumerate() {
        crate::db::columns::create_column(&state.db, &board_id, title, i as i64).await?;
    }
    for (name, color) in &[
        ("Bug", "#ef4444"), ("Feature", "#3b82f6"), ("Enhancement", "#8b5cf6"),
        ("Documentation", "#06b6d4"), ("High Priority", "#f97316"),
    ] {
        crate::db::labels::create_label(&state.db, &board_id, name, color).await?;
    }
    let snap = services::boards::board_snapshot(&state.db, &board_id)
        .await?
        .ok_or_else(|| AppError::internal("Failed to create board"))?;
    Ok((StatusCode::CREATED, Json(serde_json::to_value(snap).unwrap())))
}

pub async fn get_board(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let board_row = crate::db::boards::get_board(&state.db, &board_id).await?
        .ok_or_else(|| AppError::not_found("BOARD_NOT_FOUND", "Board not found."))?;
    let kanban_user = ensure_kanban_user(&state.db, &auth.0).await?;
    repair_board(&state.db, &board_row, &kanban_user).await?;
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
        &state.db, &board_id, body.name.as_deref(),
        body.description.as_ref().map(|o| o.as_deref()),
        body.project_id.as_ref().map(|o| o.as_deref()),
    )
    .await?
    .ok_or_else(|| AppError::not_found("BOARD_NOT_FOUND", "Board not found."))?;
    let snap = services::boards::board_snapshot(&state.db, &board_id).await?;
    let board = snap.map(|s| s.board);
    Ok(Json(json!({ "board": board })))
}
