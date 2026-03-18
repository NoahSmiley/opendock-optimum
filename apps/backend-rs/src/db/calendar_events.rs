use sqlx::SqlitePool;
use crate::models::calendar_event::CalendarEventRow;

pub async fn list_events(pool: &SqlitePool, start: Option<&str>, end: Option<&str>) -> Result<Vec<CalendarEventRow>, sqlx::Error> {
    match (start, end) {
        (Some(s), Some(e)) => {
            sqlx::query_as::<_, CalendarEventRow>(
                "SELECT * FROM calendar_events WHERE start_time <= ? AND end_time >= ? ORDER BY start_time ASC",
            )
            .bind(e).bind(s).fetch_all(pool).await
        }
        _ => {
            sqlx::query_as::<_, CalendarEventRow>("SELECT * FROM calendar_events ORDER BY start_time ASC")
                .fetch_all(pool).await
        }
    }
}

pub async fn get_event(pool: &SqlitePool, id: &str) -> Result<Option<CalendarEventRow>, sqlx::Error> {
    sqlx::query_as::<_, CalendarEventRow>("SELECT * FROM calendar_events WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn create_event(
    pool: &SqlitePool, title: &str, description: Option<&str>,
    start_time: &str, end_time: &str, all_day: bool, color: &str,
    location: Option<&str>, user_id: &str,
) -> Result<CalendarEventRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, CalendarEventRow>(
        "INSERT INTO calendar_events (id, title, description, start_time, end_time, all_day, color, location, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(title).bind(description).bind(start_time).bind(end_time)
    .bind(all_day as i32).bind(color).bind(location).bind(user_id)
    .fetch_one(pool).await
}

pub async fn update_event(
    pool: &SqlitePool, id: &str, title: Option<&str>, description: Option<Option<&str>>,
    start_time: Option<&str>, end_time: Option<&str>, all_day: Option<bool>,
    color: Option<&str>, location: Option<Option<&str>>,
) -> Result<Option<CalendarEventRow>, sqlx::Error> {
    let e = match get_event(pool, id).await? { Some(e) => e, None => return Ok(None) };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let t = title.unwrap_or(&e.title);
    let d = match description { Some(v) => v, None => e.description.as_deref() };
    let st = start_time.unwrap_or(&e.start_time);
    let et = end_time.unwrap_or(&e.end_time);
    let ad = all_day.map(|b| b as i32).unwrap_or(e.all_day);
    let c = color.unwrap_or(&e.color);
    let l = match location { Some(v) => v, None => e.location.as_deref() };
    sqlx::query_as::<_, CalendarEventRow>(
        "UPDATE calendar_events SET title=?, description=?, start_time=?, end_time=?, all_day=?, color=?, location=?, updated_at=? WHERE id=? RETURNING *",
    )
    .bind(t).bind(d).bind(st).bind(et).bind(ad).bind(c).bind(l).bind(&now).bind(id)
    .fetch_optional(pool).await
}

pub async fn delete_event(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM calendar_events WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
