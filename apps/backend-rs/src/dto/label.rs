use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateLabelReq {
    #[validate(length(min = 1, max = 50))]
    pub name: String,
    #[validate(length(min = 1, max = 20))]
    pub color: String,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateLabelReq {
    #[validate(length(min = 1, max = 50))]
    pub name: Option<String>,
    #[validate(length(min = 1, max = 20))]
    pub color: Option<String>,
}
