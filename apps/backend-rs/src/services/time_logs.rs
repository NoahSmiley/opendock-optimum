use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::time_log::TimeLog;

pub async fn start(
    pool: &SqlitePool,
    ticket_id: &str,
    user_id: &str,
    started_at: Option<&str>,
    description: Option<&str>,
) -> Result<TimeLog, AppError> {
    let active = db::time_logs::get_active(pool, ticket_id, user_id).await?;
    if active.is_some() {
        return Err(AppError::bad_request(
            "TIMER_ALREADY_ACTIVE",
            "Timer already running for this ticket.",
        ));
    }
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let sa = started_at.unwrap_or(&now);
    let row = db::time_logs::start_time_log(pool, ticket_id, user_id, sa, description).await?;
    Ok(row.into())
}

pub async fn stop(
    pool: &SqlitePool,
    log_id: &str,
    ended_at: Option<&str>,
) -> Result<Option<TimeLog>, AppError> {
    let log = db::time_logs::get_time_log(pool, log_id).await?;
    let log = match log {
        Some(l) => l,
        None => return Ok(None),
    };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let ea = ended_at.unwrap_or(&now);
    let start = chrono::DateTime::parse_from_rfc3339(&log.started_at)
        .unwrap_or_else(|_| chrono::Utc::now().into());
    let end = chrono::DateTime::parse_from_rfc3339(ea)
        .unwrap_or_else(|_| chrono::Utc::now().into());
    let duration = (end - start).num_seconds().max(0);
    let row = db::time_logs::stop_time_log(pool, log_id, ea, duration).await?;
    Ok(row.map(Into::into))
}
