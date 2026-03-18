use sqlx::SqlitePool;
use crate::models::file_item::FileItemRow;

pub async fn list_files(pool: &SqlitePool) -> Result<Vec<FileItemRow>, sqlx::Error> {
    sqlx::query_as::<_, FileItemRow>("SELECT * FROM file_items ORDER BY created_at DESC")
        .fetch_all(pool).await
}

pub async fn get_file(pool: &SqlitePool, id: &str) -> Result<Option<FileItemRow>, sqlx::Error> {
    sqlx::query_as::<_, FileItemRow>("SELECT * FROM file_items WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn create_file(
    pool: &SqlitePool, name: &str, mime_type: &str, size: i64,
    folder_id: Option<&str>, url: &str, thumbnail_url: Option<&str>, user_id: &str,
) -> Result<FileItemRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, FileItemRow>(
        "INSERT INTO file_items (id, name, mime_type, size, folder_id, url, thumbnail_url, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(name).bind(mime_type).bind(size)
    .bind(folder_id).bind(url).bind(thumbnail_url).bind(user_id)
    .fetch_one(pool).await
}

pub async fn update_file(
    pool: &SqlitePool, id: &str, folder_id: Option<Option<&str>>, name: Option<&str>,
) -> Result<Option<FileItemRow>, sqlx::Error> {
    let e = match get_file(pool, id).await? { Some(e) => e, None => return Ok(None) };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let n = name.unwrap_or(&e.name);
    let fi = match folder_id { Some(v) => v, None => e.folder_id.as_deref() };
    sqlx::query_as::<_, FileItemRow>(
        "UPDATE file_items SET name=?, folder_id=?, updated_at=? WHERE id=? RETURNING *",
    )
    .bind(n).bind(fi).bind(&now).bind(id).fetch_optional(pool).await
}

pub async fn delete_file(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM file_items WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
