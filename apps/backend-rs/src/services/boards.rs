use sqlx::SqlitePool;

use crate::db;
use crate::error::AppError;
use crate::models::board::{Board, BoardSnapshot};
use crate::models::column::Column;
use crate::models::epic::Epic;
use crate::models::label::Label;
use crate::models::sprint::Sprint;
use crate::models::ticket::Ticket;

pub async fn board_snapshot(
    pool: &SqlitePool,
    board_id: &str,
) -> Result<Option<BoardSnapshot>, AppError> {
    let row = match db::boards::get_board(pool, board_id).await? {
        Some(r) => r,
        None => return Ok(None),
    };
    let columns: Vec<Column> = db::columns::list_by_board(pool, board_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect();
    let ticket_rows = db::tickets::list_by_board(pool, board_id).await?;
    let tickets: Vec<Ticket> = ticket_rows
        .into_iter()
        .map(|r| crate::services::tickets::row_to_ticket(r, None, None, None))
        .collect();
    let sprints: Vec<Sprint> = db::sprints::list_by_board(pool, board_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect();
    let labels: Vec<Label> = db::labels::list_by_board(pool, board_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect();
    let epics: Vec<Epic> = db::boards::list_epics_by_board(pool, board_id)
        .await?
        .into_iter()
        .map(Into::into)
        .collect();
    let member_ids: Vec<String> = serde_json::from_str(&row.member_ids).unwrap_or_default();
    let members = db::boards::get_kanban_users_by_ids(pool, &member_ids).await?;
    let components: Vec<String> = row
        .components
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();

    let board = Board {
        id: row.id,
        name: row.name,
        description: row.description,
        project_id: row.project_id,
        project_key: row.project_key,
        project_type: row.project_type,
        created_at: row.created_at,
        member_ids,
        active_sprint_id: row.active_sprint_id,
        columns: columns.clone(),
        tickets: tickets.clone(),
        sprints: sprints.clone(),
        epics,
        members: members.clone(),
        labels: labels.clone(),
        components,
    };
    Ok(Some(BoardSnapshot {
        board,
        columns,
        tickets,
        sprints,
        members,
        labels,
    }))
}
