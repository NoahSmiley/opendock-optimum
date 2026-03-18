use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::board::BoardRow;
use crate::models::user::{KanbanUser, PublicUser};

/// Ensure the authenticated user has a corresponding kanban_user row.
pub async fn ensure_kanban_user(pool: &SqlitePool, user: &PublicUser) -> Result<KanbanUser, AppError> {
    if let Some(ku) = db::kanban_users::find_by_email(pool, &user.email).await? {
        return Ok(ku);
    }
    let uid = ulid::Ulid::new().to_string().to_lowercase();
    let name = user.display_name.as_deref().unwrap_or(&user.email);
    Ok(db::kanban_users::create(pool, &uid, name, Some(&user.email), "#4f46e5").await?)
}

/// Generate a project key from a board name (uppercase letters, max 5 chars).
pub fn project_key_from_name(name: &str) -> String {
    let key: String = name.chars()
        .filter(|c| c.is_ascii_alphabetic())
        .take(5)
        .collect::<String>()
        .to_uppercase();
    if key.is_empty() { "PROJ".to_string() } else { key }
}

/// Auto-repair a board: ensure the user is a member, project_key exists, default labels seeded.
pub async fn repair_board(
    pool: &SqlitePool,
    board: &BoardRow,
    kanban_user: &KanbanUser,
) -> Result<(), AppError> {
    // Ensure user is a board member
    let mut member_ids: Vec<String> = serde_json::from_str(&board.member_ids).unwrap_or_default();
    if !member_ids.contains(&kanban_user.id) {
        member_ids.push(kanban_user.id.clone());
        let ids_json = serde_json::to_string(&member_ids).unwrap();
        db::boards::update_board_member_ids(pool, &board.id, &ids_json).await?;
    }
    // Ensure project_key exists
    if board.project_key.as_deref().unwrap_or("").is_empty() {
        let key = project_key_from_name(&board.name);
        db::boards::update_board_project_key(pool, &board.id, &key).await?;
    }
    // Seed default labels if none exist
    let labels = db::labels::list_by_board(pool, &board.id).await?;
    if labels.is_empty() {
        for (name, color) in &[
            ("Bug", "#ef4444"), ("Feature", "#3b82f6"), ("Enhancement", "#8b5cf6"),
            ("Documentation", "#06b6d4"), ("High Priority", "#f97316"),
        ] {
            db::labels::create_label(pool, &board.id, name, color).await?;
        }
    }
    Ok(())
}
