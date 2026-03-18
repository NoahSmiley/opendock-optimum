use serde::Deserialize;
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct CreateBoardReq {
    #[validate(length(min = 1, max = 160))]
    pub name: String,
    #[validate(length(max = 400))]
    pub description: Option<String>,
    pub project_id: Option<String>,
    pub members: Option<Vec<MemberInput>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemberInput {
    pub name: String,
    pub email: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase")]
pub struct UpdateBoardReq {
    #[validate(length(min = 1, max = 160))]
    pub name: Option<String>,
    pub description: Option<Option<String>>,
    pub project_id: Option<Option<String>>,
}
