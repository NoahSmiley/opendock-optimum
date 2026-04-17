use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Note {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub title: String,
    pub content: String,
    pub pinned: bool,
    pub shared_with: Vec<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateNote {
    pub title: Option<String>,
    pub content: Option<String>,
    pub pinned: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNote {
    pub title: Option<String>,
    pub content: Option<String>,
    pub pinned: Option<bool>,
    pub shared_with: Option<Vec<Uuid>>,
}
