use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Board {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub pinned: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Column {
    pub id: Uuid,
    pub board_id: Uuid,
    pub title: String,
    pub position: i32,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Card {
    pub id: Uuid,
    pub board_id: Uuid,
    pub column_id: Uuid,
    pub title: String,
    pub description: String,
    pub position: i32,
    pub assignee_id: Option<Uuid>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BoardMember {
    pub user_id: Uuid,
    pub email: String,
    pub display_name: Option<String>,
    pub role: String,
}

#[derive(Debug, Serialize)]
pub struct BoardDetail {
    pub board: Board,
    pub columns: Vec<Column>,
    pub cards: Vec<Card>,
    pub members: Vec<BoardMember>,
}

#[derive(Debug, Deserialize)]
pub struct AddBoardMember {
    pub email: Option<String>,
    pub user_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBoard {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateBoard {
    pub name: Option<String>,
    pub pinned: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct CreateColumn {
    pub title: String,
    pub position: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCard {
    pub column_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub assignee_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCard {
    pub title: Option<String>,
    pub description: Option<String>,
    pub column_id: Option<Uuid>,
    pub position: Option<i32>,
    pub assignee_id: Option<Option<Uuid>>,
}
