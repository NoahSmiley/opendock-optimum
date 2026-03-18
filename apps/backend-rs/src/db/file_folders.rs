use sqlx::SqlitePool;
use crate::models::file_folder::FileFolderRow;

pub async fn list_folders(pool: &SqlitePool) -> Result<Vec<FileFolderRow>, sqlx::Error> {
    sqlx::query_as::<_, FileFolderRow>("SELECT * FROM file_folders ORDER BY name ASC")
        .fetch_all(pool).await
}

pub async fn create_folder(pool: &SqlitePool, name: &str, parent_id: Option<&str>) -> Result<FileFolderRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, FileFolderRow>(
        "INSERT INTO file_folders (id, name, parent_id) VALUES (?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(name).bind(parent_id).fetch_one(pool).await
}

#[allow(dead_code)]
pub async fn get_folder(pool: &SqlitePool, id: &str) -> Result<Option<FileFolderRow>, sqlx::Error> {
    sqlx::query_as::<_, FileFolderRow>("SELECT * FROM file_folders WHERE id = ?")
        .bind(id).fetch_optional(pool).await
}

pub async fn delete_folder(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM file_folders WHERE id = ?").bind(id).execute(pool).await?;
    Ok(r.rows_affected() > 0)
}
