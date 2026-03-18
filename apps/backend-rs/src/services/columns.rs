use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::column::Column;

pub async fn create_column(
    pool: &SqlitePool,
    board_id: &str,
    title: &str,
    order: Option<i64>,
) -> Result<Column, AppError> {
    let ord = match order {
        Some(o) => o,
        None => db::columns::max_order(pool, board_id).await? + 1,
    };
    let row = db::columns::create_column(pool, board_id, title, ord).await?;
    Ok(row.into())
}
