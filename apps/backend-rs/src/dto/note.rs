use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteReq {
    #[validate(length(min = 1))]
    pub title: String,
    pub content: Option<String>,
    pub content_type: Option<String>,
    pub folder_id: Option<String>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: Option<bool>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteReq {
    pub title: Option<String>,
    pub content: Option<String>,
    pub content_type: Option<String>,
    pub folder_id: Option<Option<String>>,
    pub tags: Option<Vec<String>>,
    pub is_pinned: Option<bool>,
    pub is_archived: Option<bool>,
}
