use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::collection::Collection;

pub async fn get_with_count(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<Collection>, AppError> {
    let row = match db::collections::get_collection(pool, id).await? {
        Some(r) => r,
        None => return Ok(None),
    };
    let count = db::collections::note_count(pool, id).await?;
    Ok(Some(Collection {
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
        icon: row.icon,
        user_id: row.user_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        note_count: Some(count),
    }))
}

pub async fn list_with_counts(pool: &SqlitePool) -> Result<Vec<Collection>, AppError> {
    let rows = db::collections::list_collections(pool).await?;
    let mut out = Vec::with_capacity(rows.len());
    for r in rows {
        let count = db::collections::note_count(pool, &r.id).await?;
        out.push(Collection {
            id: r.id,
            name: r.name,
            description: r.description,
            color: r.color,
            icon: r.icon,
            user_id: r.user_id,
            created_at: r.created_at,
            updated_at: r.updated_at,
            note_count: Some(count),
        });
    }
    Ok(out)
}
