use sqlx::SqlitePool;

use crate::models::ticket::TicketRow;

pub async fn list_by_board(pool: &SqlitePool, board_id: &str) -> Result<Vec<TicketRow>, sqlx::Error> {
    sqlx::query_as::<_, TicketRow>(
        r#"SELECT * FROM kanban_tickets WHERE board_id = ? ORDER BY "order" ASC"#,
    )
    .bind(board_id)
    .fetch_all(pool)
    .await
}

pub async fn get_ticket(pool: &SqlitePool, id: &str) -> Result<Option<TicketRow>, sqlx::Error> {
    sqlx::query_as::<_, TicketRow>("SELECT * FROM kanban_tickets WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn create_ticket(
    pool: &SqlitePool,
    id: &str,
    board_id: &str,
    column_id: &str,
    title: &str,
    description: Option<&str>,
    assignee_ids: &str,
    tags: &str,
    label_ids: &str,
    estimate: Option<f64>,
    priority: &str,
    sprint_id: Option<&str>,
    due_date: Option<&str>,
    order: i64,
) -> Result<TicketRow, sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    sqlx::query_as::<_, TicketRow>(
        r#"INSERT INTO kanban_tickets
           (id, board_id, column_id, title, description, assignee_ids, tags, label_ids,
            estimate, priority, sprint_id, due_date, "order", created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *"#,
    )
    .bind(id)
    .bind(board_id)
    .bind(column_id)
    .bind(title)
    .bind(description)
    .bind(assignee_ids)
    .bind(tags)
    .bind(label_ids)
    .bind(estimate)
    .bind(priority)
    .bind(sprint_id)
    .bind(due_date)
    .bind(order)
    .bind(&now)
    .bind(&now)
    .fetch_one(pool)
    .await
}

pub async fn update_ticket(
    pool: &SqlitePool,
    id: &str,
    title: Option<&str>,
    description: Option<&str>,
    column_id: Option<&str>,
    assignee_ids: Option<&str>,
    tags: Option<&str>,
    label_ids: Option<&str>,
    estimate: Option<Option<f64>>,
    story_points: Option<Option<f64>>,
    priority: Option<&str>,
    sprint_id: Option<Option<&str>>,
    due_date: Option<Option<&str>>,
) -> Result<Option<TicketRow>, sqlx::Error> {
    let existing = get_ticket(pool, id).await?;
    let e = match existing {
        Some(e) => e,
        None => return Ok(None),
    };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let t = title.unwrap_or(&e.title);
    let d = description.or(e.description.as_deref());
    let ci = column_id.unwrap_or(&e.column_id);
    let ai = assignee_ids.unwrap_or(&e.assignee_ids);
    let tg = tags.unwrap_or(&e.tags);
    let li = label_ids.unwrap_or(&e.label_ids);
    let est = match estimate {
        Some(v) => v,
        None => e.estimate,
    };
    let sp = match story_points {
        Some(v) => v,
        None => e.story_points,
    };
    let pri = priority.unwrap_or(&e.priority);
    let si = match sprint_id {
        Some(v) => v,
        None => e.sprint_id.as_deref(),
    };
    let dd = match due_date {
        Some(v) => v,
        None => e.due_date.as_deref(),
    };
    sqlx::query_as::<_, TicketRow>(
        "UPDATE kanban_tickets SET title=?, description=?, column_id=?, assignee_ids=?, tags=?,
         label_ids=?, estimate=?, story_points=?, priority=?, sprint_id=?, due_date=?, updated_at=?
         WHERE id=? RETURNING *",
    )
    .bind(t).bind(d).bind(ci).bind(ai).bind(tg).bind(li)
    .bind(est).bind(sp).bind(pri).bind(si).bind(dd).bind(&now).bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn delete_ticket(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM kanban_tickets WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn max_order_in_column(pool: &SqlitePool, column_id: &str) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"SELECT COALESCE(MAX("order"), -1) FROM kanban_tickets WHERE column_id = ?"#,
    )
    .bind(column_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn update_ticket_position(
    pool: &SqlitePool,
    id: &str,
    column_id: &str,
    order: i64,
) -> Result<(), sqlx::Error> {
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    sqlx::query(
        r#"UPDATE kanban_tickets SET column_id = ?, "order" = ?, updated_at = ? WHERE id = ?"#,
    )
    .bind(column_id)
    .bind(order)
    .bind(&now)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}
