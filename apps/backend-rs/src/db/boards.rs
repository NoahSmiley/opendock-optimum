use sqlx::SqlitePool;

use crate::models::board::BoardRow;
use crate::models::epic::EpicRow;

pub async fn list_boards(pool: &SqlitePool) -> Result<Vec<BoardRow>, sqlx::Error> {
    sqlx::query_as::<_, BoardRow>("SELECT * FROM kanban_boards ORDER BY created_at DESC")
        .fetch_all(pool)
        .await
}

pub async fn get_board(pool: &SqlitePool, id: &str) -> Result<Option<BoardRow>, sqlx::Error> {
    sqlx::query_as::<_, BoardRow>("SELECT * FROM kanban_boards WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn create_board(
    pool: &SqlitePool,
    id: &str,
    name: &str,
    description: Option<&str>,
    project_id: Option<&str>,
    project_key: &str,
    member_ids: &str,
) -> Result<BoardRow, sqlx::Error> {
    sqlx::query_as::<_, BoardRow>(
        "INSERT INTO kanban_boards (id, name, description, project_id, project_key, member_ids)
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(id)
    .bind(name)
    .bind(description)
    .bind(project_id)
    .bind(project_key)
    .bind(member_ids)
    .fetch_one(pool)
    .await
}

pub async fn update_board(
    pool: &SqlitePool,
    id: &str,
    name: Option<&str>,
    description: Option<Option<&str>>,
    project_id: Option<Option<&str>>,
) -> Result<Option<BoardRow>, sqlx::Error> {
    let existing = get_board(pool, id).await?;
    if existing.is_none() {
        return Ok(None);
    }
    let e = existing.unwrap();
    let n = name.unwrap_or(&e.name);
    let d = match description {
        Some(v) => v,
        None => e.description.as_deref(),
    };
    let p = match project_id {
        Some(v) => v,
        None => e.project_id.as_deref(),
    };
    sqlx::query_as::<_, BoardRow>(
        "UPDATE kanban_boards SET name = ?, description = ?, project_id = ? WHERE id = ? RETURNING *",
    )
    .bind(n)
    .bind(d)
    .bind(p)
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn update_board_member_ids(
    pool: &SqlitePool,
    id: &str,
    member_ids: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE kanban_boards SET member_ids = ? WHERE id = ?")
        .bind(member_ids)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_board_project_key(
    pool: &SqlitePool,
    id: &str,
    project_key: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE kanban_boards SET project_key = ? WHERE id = ?")
        .bind(project_key)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_board(pool: &SqlitePool, id: &str) -> Result<bool, sqlx::Error> {
    let r = sqlx::query("DELETE FROM kanban_boards WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn list_epics_by_board(
    pool: &SqlitePool,
    board_id: &str,
) -> Result<Vec<EpicRow>, sqlx::Error> {
    sqlx::query_as::<_, EpicRow>(
        "SELECT * FROM kanban_epics WHERE board_id = ? ORDER BY created_at ASC",
    )
    .bind(board_id)
    .fetch_all(pool)
    .await
}
