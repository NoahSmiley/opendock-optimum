use sqlx::SqlitePool;
use crate::models::folder::FolderRow;

pub async fn list_folders(pool: &SqlitePool) -> Result<Vec<FolderRow>, sqlx::Error> {
    sqlx::query_as::<_, FolderRow>("SELECT * FROM note_folders ORDER BY name ASC")
        .fetch_all(pool).await
}

pub async fn get_folder(pool: &SqlitePool, id: &str) -> Result<Option<FolderRow>, sqlx::Error> {
    sqlx::query_as::<_, FolderRow>("SELECT * FROM note_folders WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn create_folder(
    pool: &SqlitePool, name: &str, color: Option<&str>, icon: Option<&str>,
    parent_id: Option<&str>, user_id: &str,
) -> Result<FolderRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, FolderRow>(
        "INSERT INTO note_folders (id, name, color, icon, parent_id, user_id)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(name).bind(color).bind(icon).bind(parent_id).bind(user_id)
    .fetch_one(pool).await
}

pub async fn update_folder(
    pool: &SqlitePool, id: &str, name: Option<&str>,
    color: Option<Option<&str>>, icon: Option<Option<&str>>,
    parent_id: Option<Option<&str>>,
) -> Result<Option<FolderRow>, sqlx::Error> {
    let e = match get_folder(pool, id).await? { Some(e) => e, None => return Ok(None) };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let n = name.unwrap_or(&e.name);
    let c = match color { Some(v) => v, None => e.color.as_deref() };
    let i = match icon { Some(v) => v, None => e.icon.as_deref() };
    let p = match parent_id { Some(v) => v, None => e.parent_id.as_deref() };
    sqlx::query_as::<_, FolderRow>(
        "UPDATE note_folders SET name=?, color=?, icon=?, parent_id=?, updated_at=? WHERE id=? RETURNING *",
    )
    .bind(n).bind(c).bind(i).bind(p).bind(&now).bind(id)
    .fetch_optional(pool).await
}

pub async fn delete_folder(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM note_folders WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
