use std::path::PathBuf;

use serde::Deserialize;
use sqlx::SqlitePool;

use super::migrate_kanban_extras;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct State {
    #[serde(default)]
    kanban_boards: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_columns: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_tickets: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_sprints: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_users: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_comments: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_time_logs: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_activities: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_labels: Vec<serde_json::Value>,
    #[serde(default)]
    kanban_attachments: Vec<serde_json::Value>,
}

pub async fn run(root: &PathBuf, target: &SqlitePool) -> Result<(), Box<dyn std::error::Error>> {
    let state_path = root.join("apps/backend/data/state.json");
    if !state_path.exists() {
        println!("No state.json found, skipping kanban migration");
        return Ok(());
    }
    let data = std::fs::read_to_string(&state_path)?;
    let state: State = serde_json::from_str(&data)?;

    migrate_users(&state, target).await?;
    migrate_boards(&state, target).await?;
    migrate_columns(&state, target).await?;
    migrate_tickets(&state, target).await?;
    migrate_sprints(&state, target).await?;
    migrate_labels(&state, target).await?;
    migrate_kanban_extras::migrate_comments(&state.kanban_comments, target).await?;
    migrate_kanban_extras::migrate_time_logs(&state.kanban_time_logs, target).await?;
    migrate_kanban_extras::migrate_activities(&state.kanban_activities, target).await?;
    migrate_kanban_extras::migrate_attachments(&state.kanban_attachments, target).await?;
    Ok(())
}

fn s(v: &serde_json::Value, key: &str) -> String {
    v.get(key).and_then(|v| v.as_str()).unwrap_or("").to_string()
}

async fn migrate_users(state: &State, db: &SqlitePool) -> Result<(), sqlx::Error> {
    for u in &state.kanban_users {
        let color = u.get("avatarColor").and_then(|v| v.as_str()).unwrap_or("#4f46e5");
        sqlx::query("INSERT OR IGNORE INTO kanban_users (id, name, email, avatar_color) VALUES (?,?,?,?)")
            .bind(s(u, "id")).bind(s(u, "name")).bind(u.get("email").and_then(|v| v.as_str())).bind(color)
            .execute(db).await?;
    }
    println!("  Migrated {} kanban users", state.kanban_users.len());
    Ok(())
}

async fn migrate_boards(state: &State, db: &SqlitePool) -> Result<(), sqlx::Error> {
    for b in &state.kanban_boards {
        let member_ids = b.get("memberIds").map(|v| v.to_string()).unwrap_or("[]".into());
        sqlx::query("INSERT OR IGNORE INTO kanban_boards (id, name, description, member_ids, created_at) VALUES (?,?,?,?,?)")
            .bind(s(b,"id")).bind(s(b,"name")).bind(b.get("description").and_then(|v|v.as_str()))
            .bind(&member_ids).bind(s(b,"createdAt"))
            .execute(db).await?;
    }
    println!("  Migrated {} boards", state.kanban_boards.len());
    Ok(())
}

async fn migrate_columns(state: &State, db: &SqlitePool) -> Result<(), sqlx::Error> {
    for c in &state.kanban_columns {
        let order = c.get("order").and_then(|v| v.as_i64()).unwrap_or(0);
        sqlx::query(r#"INSERT OR IGNORE INTO kanban_columns (id, board_id, title, "order") VALUES (?,?,?,?)"#)
            .bind(s(c,"id")).bind(s(c,"boardId")).bind(s(c,"title")).bind(order)
            .execute(db).await?;
    }
    println!("  Migrated {} columns", state.kanban_columns.len());
    Ok(())
}

async fn migrate_tickets(state: &State, db: &SqlitePool) -> Result<(), sqlx::Error> {
    for t in &state.kanban_tickets {
        let order = t.get("order").and_then(|v| v.as_i64()).unwrap_or(0);
        let ai = t.get("assigneeIds").map(|v| v.to_string()).unwrap_or("[]".into());
        let tags = t.get("tags").map(|v| v.to_string()).unwrap_or("[]".into());
        let li = t.get("labelIds").map(|v| v.to_string()).unwrap_or("[]".into());
        let pri = t.get("priority").and_then(|v| v.as_str()).unwrap_or("medium");
        sqlx::query(r#"INSERT OR IGNORE INTO kanban_tickets
            (id, board_id, column_id, title, description, assignee_ids, tags, label_ids,
             estimate, priority, sprint_id, due_date, "order", created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"#)
        .bind(s(t,"id")).bind(s(t,"boardId")).bind(s(t,"columnId")).bind(s(t,"title"))
        .bind(t.get("description").and_then(|v| v.as_str()))
        .bind(&ai).bind(&tags).bind(&li)
        .bind(t.get("estimate").and_then(|v| v.as_f64()))
        .bind(pri)
        .bind(t.get("sprintId").and_then(|v| v.as_str()))
        .bind(t.get("dueDate").and_then(|v| v.as_str()))
        .bind(order).bind(s(t,"createdAt")).bind(s(t,"updatedAt"))
        .execute(db).await?;
    }
    println!("  Migrated {} tickets", state.kanban_tickets.len());
    Ok(())
}

async fn migrate_sprints(state: &State, db: &SqlitePool) -> Result<(), sqlx::Error> {
    for sp in &state.kanban_sprints {
        let status = sp.get("status").and_then(|v| v.as_str()).unwrap_or("planned");
        sqlx::query("INSERT OR IGNORE INTO kanban_sprints (id, board_id, name, goal, start_date, end_date, status) VALUES (?,?,?,?,?,?,?)")
            .bind(s(sp,"id")).bind(s(sp,"boardId")).bind(s(sp,"name"))
            .bind(sp.get("goal").and_then(|v| v.as_str()))
            .bind(s(sp,"startDate")).bind(s(sp,"endDate")).bind(status)
            .execute(db).await?;
    }
    println!("  Migrated {} sprints", state.kanban_sprints.len());
    Ok(())
}

async fn migrate_labels(state: &State, db: &SqlitePool) -> Result<(), sqlx::Error> {
    for l in &state.kanban_labels {
        sqlx::query("INSERT OR IGNORE INTO kanban_labels (id, board_id, name, color, created_at) VALUES (?,?,?,?,?)")
            .bind(s(l,"id")).bind(s(l,"boardId")).bind(s(l,"name")).bind(s(l,"color")).bind(s(l,"createdAt"))
            .execute(db).await?;
    }
    println!("  Migrated {} labels", state.kanban_labels.len());
    Ok(())
}
