use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::label::Label;

pub async fn create_label(
    pool: &SqlitePool,
    board_id: &str,
    name: &str,
    color: &str,
) -> Result<Label, AppError> {
    let row = db::labels::create_label(pool, board_id, name, color).await?;
    Ok(row.into())
}
