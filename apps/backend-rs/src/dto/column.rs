use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateColumnReq {
    #[validate(length(min = 1, max = 120))]
    pub title: String,
    pub order: Option<i64>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateColumnReq {
    #[validate(length(min = 1, max = 120))]
    pub title: Option<String>,
    pub wip_limit: Option<Option<i64>>,
}
