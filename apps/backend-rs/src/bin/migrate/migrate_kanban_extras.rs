use sqlx::SqlitePool;

fn s(v: &serde_json::Value, key: &str) -> String {
    v.get(key).and_then(|v| v.as_str()).unwrap_or("").to_string()
}

pub async fn migrate_comments(items: &[serde_json::Value], db: &SqlitePool) -> Result<(), sqlx::Error> {
    for c in items {
        sqlx::query("INSERT OR IGNORE INTO kanban_comments (id, ticket_id, user_id, content, created_at, updated_at) VALUES (?,?,?,?,?,?)")
            .bind(s(c,"id")).bind(s(c,"ticketId")).bind(s(c,"userId")).bind(s(c,"content"))
            .bind(s(c,"createdAt")).bind(s(c,"updatedAt"))
            .execute(db).await?;
    }
    println!("  Migrated {} comments", items.len());
    Ok(())
}

pub async fn migrate_time_logs(items: &[serde_json::Value], db: &SqlitePool) -> Result<(), sqlx::Error> {
    for t in items {
        let dur = t.get("duration").and_then(|v| v.as_i64()).unwrap_or(0);
        sqlx::query("INSERT OR IGNORE INTO kanban_time_logs (id, ticket_id, user_id, started_at, ended_at, duration, description, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)")
            .bind(s(t,"id")).bind(s(t,"ticketId")).bind(s(t,"userId")).bind(s(t,"startedAt"))
            .bind(t.get("endedAt").and_then(|v| v.as_str()))
            .bind(dur)
            .bind(t.get("description").and_then(|v| v.as_str()))
            .bind(s(t,"createdAt")).bind(s(t,"updatedAt"))
            .execute(db).await?;
    }
    println!("  Migrated {} time logs", items.len());
    Ok(())
}

pub async fn migrate_activities(items: &[serde_json::Value], db: &SqlitePool) -> Result<(), sqlx::Error> {
    for a in items {
        let meta = a.get("metadata").map(|v| v.to_string());
        sqlx::query("INSERT OR IGNORE INTO kanban_activities (id, board_id, user_id, type, ticket_id, column_id, sprint_id, metadata, created_at) VALUES (?,?,?,?,?,?,?,?,?)")
            .bind(s(a,"id")).bind(s(a,"boardId")).bind(s(a,"userId")).bind(s(a,"type"))
            .bind(a.get("ticketId").and_then(|v| v.as_str()))
            .bind(a.get("columnId").and_then(|v| v.as_str()))
            .bind(a.get("sprintId").and_then(|v| v.as_str()))
            .bind(meta.as_deref())
            .bind(s(a,"createdAt"))
            .execute(db).await?;
    }
    println!("  Migrated {} activities", items.len());
    Ok(())
}

pub async fn migrate_attachments(items: &[serde_json::Value], db: &SqlitePool) -> Result<(), sqlx::Error> {
    for a in items {
        let size = a.get("size").and_then(|v| v.as_i64()).unwrap_or(0);
        sqlx::query("INSERT OR IGNORE INTO kanban_attachments (id, ticket_id, user_id, filename, original_filename, mime_type, size, url, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)")
            .bind(s(a,"id")).bind(s(a,"ticketId")).bind(s(a,"userId"))
            .bind(s(a,"filename")).bind(s(a,"originalFilename")).bind(s(a,"mimeType"))
            .bind(size).bind(s(a,"url"))
            .bind(s(a,"createdAt")).bind(s(a,"updatedAt"))
            .execute(db).await?;
    }
    println!("  Migrated {} attachments", items.len());
    Ok(())
}
