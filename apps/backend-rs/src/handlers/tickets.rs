use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::ticket::{CommentReq, CreateTicketReq, ReorderReq, UpdateTicketReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::services;

pub async fn create_ticket(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateTicketReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    if crate::db::boards::get_board(&state.db, &board_id).await?.is_none() {
        return Err(AppError::not_found("BOARD_NOT_FOUND", "Board not found."));
    }
    let id = ulid::Ulid::new().to_string().to_lowercase();
    let order = crate::db::tickets::max_order_in_column(&state.db, &body.column_id).await? + 1;
    let ai = serde_json::to_string(&body.assignee_ids.unwrap_or_default()).unwrap();
    let tg = serde_json::to_string(&body.tags.unwrap_or_default()).unwrap();
    let li = serde_json::to_string(&body.label_ids.unwrap_or_default()).unwrap();
    let pri = body.priority.as_deref().unwrap_or("medium");
    let row = crate::db::tickets::create_ticket(
        &state.db, &id, &board_id, &body.column_id, &body.title,
        body.description.as_deref(), &ai, &tg, &li,
        body.estimate, pri, body.sprint_id.as_deref(),
        body.due_date.as_deref(), order,
    ).await?;
    let ticket = services::tickets::row_to_ticket(row, None, None, None);
    state.event_bus.broadcast(crate::sse::KanbanEvent::TicketCreated {
        board_id, ticket_id: ticket.id.clone(),
    }).await;
    Ok((StatusCode::CREATED, Json(json!({ "ticket": ticket }))))
}

pub async fn update_ticket(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateTicketReq>,
) -> Result<Json<Value>, AppError> {
    let ai = body.assignee_ids.as_ref().map(|v| serde_json::to_string(v).unwrap());
    let tg = body.tags.as_ref().map(|v| serde_json::to_string(v).unwrap());
    let li = body.label_ids.as_ref().map(|v| serde_json::to_string(v).unwrap());
    let row = crate::db::tickets::update_ticket(
        &state.db, &ticket_id, body.title.as_deref(), body.description.as_deref(),
        ai.as_deref(), tg.as_deref(), li.as_deref(),
        body.estimate, body.priority.as_deref(),
        body.sprint_id.as_ref().map(|o| o.as_deref()),
        body.due_date.as_ref().map(|o| o.as_deref()),
    )
    .await?
    .ok_or_else(|| AppError::not_found("TICKET_NOT_FOUND", "Ticket not found."))?;
    let ticket = services::tickets::row_to_ticket(row, None, None, None);
    state.event_bus.broadcast(crate::sse::KanbanEvent::TicketUpdated {
        board_id: ticket.board_id.clone(), ticket_id: ticket.id.clone(),
    }).await;
    Ok(Json(json!({ "ticket": ticket })))
}

pub async fn delete_ticket(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    let ticket = crate::db::tickets::get_ticket(&state.db, &ticket_id).await?
        .ok_or_else(|| AppError::not_found("TICKET_NOT_FOUND", "Ticket not found."))?;
    crate::db::tickets::delete_ticket(&state.db, &ticket_id).await?;
    state.event_bus.broadcast(crate::sse::KanbanEvent::TicketDeleted {
        board_id: ticket.board_id, ticket_id,
    }).await;
    Ok(Json(json!({ "ok": true })))
}

pub async fn reorder_ticket(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<ReorderReq>,
) -> Result<Json<Value>, AppError> {
    crate::db::tickets::update_ticket_position(
        &state.db, &body.ticket_id, &body.to_column_id, body.to_index,
    ).await?;
    state.event_bus.broadcast(crate::sse::KanbanEvent::TicketReordered {
        board_id: board_id.clone(),
    }).await;
    let snap = services::boards::board_snapshot(&state.db, &board_id)
        .await?
        .ok_or_else(|| AppError::bad_request("REORDER_FAILED", "Board not found."))?;
    Ok(Json(serde_json::to_value(snap).unwrap()))
}

pub async fn add_comment(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
    auth: AuthUser,
    Json(body): Json<CommentReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    if body.content.trim().is_empty() {
        return Err(AppError::bad_request("INVALID_PAYLOAD", "Content is required."));
    }
    let row = crate::db::comments::add_comment(&state.db, &ticket_id, &auth.0.id, &body.content)
        .await?;
    let comment: crate::models::comment::Comment = row.into();
    Ok((StatusCode::CREATED, Json(json!({ "comment": comment }))))
}

pub async fn delete_comment(
    State(state): State<AppState>,
    Path(comment_id): Path<String>,
    _auth: AuthUser,
) -> Result<Json<Value>, AppError> {
    if !crate::db::comments::delete_comment(&state.db, &comment_id).await? {
        return Err(AppError::not_found("COMMENT_NOT_FOUND", "Comment not found."));
    }
    Ok(Json(json!({ "ok": true })))
}
