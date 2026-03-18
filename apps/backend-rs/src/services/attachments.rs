use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::uploads;

pub async fn delete_attachment(
    pool: &SqlitePool,
    uploads_dir: &str,
    attachment_id: &str,
) -> Result<bool, AppError> {
    let att = db::attachments::get_attachment(pool, attachment_id).await?;
    if let Some(a) = att {
        uploads::cleanup::delete_file(uploads_dir, &a.filename)
            .await
            .ok();
        db::attachments::delete_attachment(pool, attachment_id).await?;
        return Ok(true);
    }
    Ok(false)
}
