use sqlx::SqlitePool;
use crate::models::note::NoteRow;

pub async fn list_active(pool: &SqlitePool) -> Result<Vec<NoteRow>, sqlx::Error> {
    sqlx::query_as::<_, NoteRow>("SELECT * FROM notes WHERE is_archived = 0 ORDER BY updated_at DESC")
        .fetch_all(pool).await
}

pub async fn list_archived(pool: &SqlitePool) -> Result<Vec<NoteRow>, sqlx::Error> {
    sqlx::query_as::<_, NoteRow>("SELECT * FROM notes WHERE is_archived = 1 ORDER BY updated_at DESC")
        .fetch_all(pool).await
}

pub async fn get_note(pool: &SqlitePool, id: &str) -> Result<Option<NoteRow>, sqlx::Error> {
    sqlx::query_as::<_, NoteRow>("SELECT * FROM notes WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn create_note(
    pool: &SqlitePool, title: &str, content: &str, content_type: &str,
    folder_id: Option<&str>, tags: &str, is_pinned: bool, user_id: &str,
) -> Result<NoteRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, NoteRow>(
        "INSERT INTO notes (id, title, content, content_type, folder_id, tags, is_pinned, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(title).bind(content).bind(content_type)
    .bind(folder_id).bind(tags).bind(is_pinned as i32).bind(user_id)
    .fetch_one(pool).await
}

pub async fn update_note(
    pool: &SqlitePool, id: &str, title: Option<&str>, content: Option<&str>,
    content_type: Option<&str>, folder_id: Option<Option<&str>>, tags: Option<&str>,
    is_pinned: Option<bool>, is_archived: Option<bool>,
) -> Result<Option<NoteRow>, sqlx::Error> {
    let e = match get_note(pool, id).await? { Some(e) => e, None => return Ok(None) };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let t = title.unwrap_or(&e.title);
    let c = content.unwrap_or(&e.content);
    let ct = content_type.unwrap_or(&e.content_type);
    let fi = match folder_id { Some(v) => v, None => e.folder_id.as_deref() };
    let tg = tags.unwrap_or(&e.tags);
    let ip = is_pinned.map(|b| b as i32).unwrap_or(e.is_pinned);
    let ia = is_archived.map(|b| b as i32).unwrap_or(e.is_archived);
    sqlx::query_as::<_, NoteRow>(
        "UPDATE notes SET title=?, content=?, content_type=?, folder_id=?, tags=?,
         is_pinned=?, is_archived=?, updated_at=? WHERE id=? RETURNING *",
    )
    .bind(t).bind(c).bind(ct).bind(fi).bind(tg)
    .bind(ip).bind(ia).bind(&now).bind(id)
    .fetch_optional(pool).await
}

pub async fn delete_note(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM notes WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}

pub async fn get_all_tags(pool: &SqlitePool) -> Result<Vec<String>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT DISTINCT tags FROM notes WHERE is_archived = 0 AND tags != '[]'",
    )
    .fetch_all(pool).await?;
    let mut all_tags: Vec<String> = Vec::new();
    for (tags_json,) in rows {
        if let Ok(tags) = serde_json::from_str::<Vec<String>>(&tags_json) {
            all_tags.extend(tags);
        }
    }
    all_tags.sort();
    all_tags.dedup();
    Ok(all_tags)
}
