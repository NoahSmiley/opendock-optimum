use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct ColumnRow {
    pub id: String,
    pub board_id: String,
    pub title: String,
    pub order: i64,
    pub wip_limit: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub id: String,
    pub board_id: String,
    pub title: String,
    pub order: i64,
    pub wip_limit: Option<i64>,
}

impl From<ColumnRow> for Column {
    fn from(r: ColumnRow) -> Self {
        Self {
            id: r.id,
            board_id: r.board_id,
            title: r.title,
            order: r.order,
            wip_limit: r.wip_limit,
        }
    }
}
