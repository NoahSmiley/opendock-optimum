use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::uploads;

pub async fn delete_file(
    pool: &SqlitePool,
    uploads_dir: &str,
    file_id: &str,
) -> Result<bool, AppError> {
    let file = db::file_items::get_file(pool, file_id).await?;
    if let Some(f) = file {
        let filename = f.url.rsplit('/').next().unwrap_or("");
        uploads::cleanup::delete_file(uploads_dir, filename).await.ok();
        db::file_items::delete_file(pool, file_id).await?;
        return Ok(true);
    }
    Ok(false)
}
