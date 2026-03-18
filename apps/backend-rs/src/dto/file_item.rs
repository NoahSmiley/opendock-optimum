use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFileReq {
    pub folder_id: Option<Option<String>>,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateFileFolderReq {
    #[validate(length(min = 1))]
    pub name: String,
    pub parent_id: Option<String>,
}
