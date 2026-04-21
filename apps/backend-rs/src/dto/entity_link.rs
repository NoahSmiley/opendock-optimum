use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "entity_kind", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum EntityKind {
    Note,
    Card,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct EntityRef {
    pub kind: EntityKind,
    pub id: Uuid,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct EntityLink {
    pub id: Uuid,
    pub a_kind: EntityKind,
    pub a_id: Uuid,
    pub b_kind: EntityKind,
    pub b_id: Uuid,
    pub created_by: Option<Uuid>,
    pub source: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLink {
    pub a: EntityRef,
    pub b: EntityRef,
    pub source: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct LinkedEntity {
    pub link_id: Uuid,
    pub kind: EntityKind,
    pub id: Uuid,
    pub title: String,
    pub context: Option<String>,
    pub source: String,
}
