use sqlx::SqlitePool;

use crate::models::user::KanbanUser;

pub async fn list_all(pool: &SqlitePool) -> Result<Vec<KanbanUser>, sqlx::Error> {
    sqlx::query_as::<_, KanbanUser>("SELECT * FROM kanban_users")
        .fetch_all(pool)
        .await
}

pub async fn get_by_ids(
    pool: &SqlitePool,
    ids: &[String],
) -> Result<Vec<KanbanUser>, sqlx::Error> {
    if ids.is_empty() {
        return Ok(vec![]);
    }
    let placeholders = ids.iter().map(|_| "?").collect::<Vec<_>>().join(",");
    let query = format!("SELECT * FROM kanban_users WHERE id IN ({placeholders})");
    let mut q = sqlx::query_as::<_, KanbanUser>(&query);
    for id in ids {
        q = q.bind(id);
    }
    q.fetch_all(pool).await
}

pub async fn create(
    pool: &SqlitePool,
    id: &str,
    name: &str,
    email: Option<&str>,
    avatar_color: &str,
) -> Result<KanbanUser, sqlx::Error> {
    sqlx::query_as::<_, KanbanUser>(
        "INSERT INTO kanban_users (id, name, email, avatar_color)
         VALUES (?, ?, ?, ?) RETURNING *",
    )
    .bind(id).bind(name).bind(email).bind(avatar_color)
    .fetch_one(pool)
    .await
}

pub async fn find_by_email(
    pool: &SqlitePool,
    email: &str,
) -> Result<Option<KanbanUser>, sqlx::Error> {
    sqlx::query_as::<_, KanbanUser>("SELECT * FROM kanban_users WHERE email = ?")
        .bind(email)
        .fetch_optional(pool)
        .await
}
