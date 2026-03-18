use sqlx::SqlitePool;
use crate::models::collection::CollectionRow;
use crate::models::note::NoteRow;

pub async fn list_collections(pool: &SqlitePool) -> Result<Vec<CollectionRow>, sqlx::Error> {
    sqlx::query_as::<_, CollectionRow>("SELECT * FROM collections ORDER BY name ASC")
        .fetch_all(pool).await
}

pub async fn get_collection(pool: &SqlitePool, id: &str) -> Result<Option<CollectionRow>, sqlx::Error> {
    sqlx::query_as::<_, CollectionRow>("SELECT * FROM collections WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn create_collection(
    pool: &SqlitePool, name: &str, description: Option<&str>,
    color: Option<&str>, icon: Option<&str>, user_id: &str,
) -> Result<CollectionRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, CollectionRow>(
        "INSERT INTO collections (id, name, description, color, icon, user_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(name).bind(description).bind(color).bind(icon).bind(user_id)
    .fetch_one(pool).await
}

pub async fn update_collection(
    pool: &SqlitePool, id: &str, name: Option<&str>,
    description: Option<Option<&str>>, color: Option<Option<&str>>, icon: Option<Option<&str>>,
) -> Result<Option<CollectionRow>, sqlx::Error> {
    let e = match get_collection(pool, id).await? { Some(e) => e, None => return Ok(None) };
    let now = chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let n = name.unwrap_or(&e.name);
    let d = match description { Some(v) => v, None => e.description.as_deref() };
    let c = match color { Some(v) => v, None => e.color.as_deref() };
    let i = match icon { Some(v) => v, None => e.icon.as_deref() };
    sqlx::query_as::<_, CollectionRow>(
        "UPDATE collections SET name=?, description=?, color=?, icon=?, updated_at=? WHERE id=? RETURNING *",
    )
    .bind(n).bind(d).bind(c).bind(i).bind(&now).bind(id)
    .fetch_optional(pool).await
}

pub async fn delete_collection(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM collections WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}

pub async fn get_notes_in_collection(pool: &SqlitePool, collection_id: &str) -> Result<Vec<NoteRow>, sqlx::Error> {
    sqlx::query_as::<_, NoteRow>(
        "SELECT n.* FROM notes n JOIN collection_notes cn ON n.id = cn.note_id WHERE cn.collection_id = ?",
    )
    .bind(collection_id).fetch_all(pool).await
}

pub async fn add_note(pool: &SqlitePool, collection_id: &str, note_id: &str) -> Result<bool, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    let r = sqlx::query(
        "INSERT OR IGNORE INTO collection_notes (id, collection_id, note_id) VALUES (?, ?, ?)",
    )
    .bind(&id).bind(collection_id).bind(note_id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}

pub async fn remove_note(pool: &SqlitePool, collection_id: &str, note_id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM collection_notes WHERE collection_id = ? AND note_id = ?")
        .bind(collection_id).bind(note_id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}

pub async fn get_collections_for_note(pool: &SqlitePool, note_id: &str) -> Result<Vec<CollectionRow>, sqlx::Error> {
    sqlx::query_as::<_, CollectionRow>(
        "SELECT c.* FROM collections c JOIN collection_notes cn ON c.id = cn.collection_id WHERE cn.note_id = ?",
    )
    .bind(note_id).fetch_all(pool).await
}

pub async fn note_count(pool: &SqlitePool, collection_id: &str) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM collection_notes WHERE collection_id = ?",
    )
    .bind(collection_id).fetch_one(pool).await?;
    Ok(row.0)
}
