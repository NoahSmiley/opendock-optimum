use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::dto::calendar_event::{CreateEventReq, EventQueryParams, UpdateEventReq};
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::AuthUser;
use crate::models::calendar_event::CalendarEvent;

pub async fn list_events(
    State(state): State<AppState>,
    Query(params): Query<EventQueryParams>,
) -> Result<Json<Value>, AppError> {
    let rows = crate::db::calendar_events::list_events(
        &state.db, params.start.as_deref(), params.end.as_deref(),
    ).await?;
    let events: Vec<CalendarEvent> = rows.into_iter().map(Into::into).collect();
    Ok(Json(json!({ "events": events })))
}

pub async fn get_event(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::calendar_events::get_event(&state.db, &id).await?
        .ok_or_else(|| AppError::not_found("NOT_FOUND", "Event not found"))?;
    Ok(Json(serde_json::to_value(CalendarEvent::from(row)).unwrap()))
}

pub async fn create_event(
    State(state): State<AppState>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<CreateEventReq>,
) -> Result<(StatusCode, Json<Value>), AppError> {
    let row = crate::db::calendar_events::create_event(
        &state.db, &body.title, body.description.as_deref(),
        &body.start_time, &body.end_time, body.all_day.unwrap_or(false),
        body.color.as_deref().unwrap_or("indigo"), body.location.as_deref(), "default-user",
    ).await?;
    Ok((StatusCode::CREATED, Json(serde_json::to_value(CalendarEvent::from(row)).unwrap())))
}

pub async fn update_event(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
    ValidatedJson(body): ValidatedJson<UpdateEventReq>,
) -> Result<Json<Value>, AppError> {
    let row = crate::db::calendar_events::update_event(
        &state.db, &id, body.title.as_deref(),
        body.description.as_ref().map(|o| o.as_deref()),
        body.start_time.as_deref(), body.end_time.as_deref(),
        body.all_day, body.color.as_deref(),
        body.location.as_ref().map(|o| o.as_deref()),
    )
    .await?
    .ok_or_else(|| AppError::not_found("NOT_FOUND", "Event not found"))?;
    Ok(Json(serde_json::to_value(CalendarEvent::from(row)).unwrap()))
}

pub async fn delete_event(
    State(state): State<AppState>,
    Path(id): Path<String>,
    _auth: AuthUser,
) -> Result<StatusCode, AppError> {
    if !crate::db::calendar_events::delete_event(&state.db, &id).await? {
        return Err(AppError::not_found("NOT_FOUND", "Event not found"));
    }
    Ok(StatusCode::NO_CONTENT)
}
