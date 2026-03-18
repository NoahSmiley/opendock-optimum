use sqlx::SqlitePool;
use crate::models::sprint::SprintRow;

pub async fn list_by_board(pool: &SqlitePool, board_id: &str) -> Result<Vec<SprintRow>, sqlx::Error> {
    sqlx::query_as::<_, SprintRow>("SELECT * FROM kanban_sprints WHERE board_id = ? ORDER BY start_date ASC")
        .bind(board_id).fetch_all(pool).await
}

pub async fn create_sprint(
    pool: &SqlitePool, board_id: &str, name: &str, goal: Option<&str>,
    start_date: &str, end_date: &str, status: &str,
) -> Result<SprintRow, sqlx::Error> {
    let id = ulid::Ulid::new().to_string().to_lowercase();
    sqlx::query_as::<_, SprintRow>(
        "INSERT INTO kanban_sprints (id, board_id, name, goal, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
    )
    .bind(&id).bind(board_id).bind(name).bind(goal)
    .bind(start_date).bind(end_date).bind(status)
    .fetch_one(pool).await
}
