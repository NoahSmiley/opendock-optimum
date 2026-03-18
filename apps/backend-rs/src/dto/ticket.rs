use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateTicketReq {
    pub column_id: String,
    #[validate(length(min = 1, max = 160))]
    pub title: String,
    #[validate(length(max = 5000))]
    pub description: Option<String>,
    pub assignee_ids: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub label_ids: Option<Vec<String>>,
    pub estimate: Option<f64>,
    pub priority: Option<String>,
    pub sprint_id: Option<String>,
    pub due_date: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTicketReq {
    #[validate(length(min = 1, max = 160))]
    pub title: Option<String>,
    #[validate(length(max = 5000))]
    pub description: Option<String>,
    pub assignee_ids: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub label_ids: Option<Vec<String>>,
    pub estimate: Option<Option<f64>>,
    pub priority: Option<String>,
    pub sprint_id: Option<Option<String>>,
    pub due_date: Option<Option<String>>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct ReorderReq {
    pub ticket_id: String,
    pub to_column_id: String,
    pub to_index: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommentReq {
    pub content: String,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateSprintReq {
    #[validate(length(min = 1, max = 120))]
    pub name: String,
    #[validate(length(max = 240))]
    pub goal: Option<String>,
    pub start_date: String,
    pub end_date: String,
    pub status: Option<String>,
}
