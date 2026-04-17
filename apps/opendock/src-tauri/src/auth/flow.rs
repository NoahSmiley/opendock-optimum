use crate::auth::state::AuthData;
use crate::auth::{API_URL, ATHION_URL};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct InitiateResponse { code: String }

#[derive(Deserialize)]
struct PollResponse { status: String, token: Option<String> }

#[derive(Deserialize)]
pub struct MeResponse {
    pub id: String,
    pub email: String,
    pub display_name: Option<String>,
}

#[derive(Serialize)]
pub struct InitiateResult { pub code: String, pub url: String }

#[derive(Serialize)]
pub struct PollResult {
    pub status: String,
    pub data: Option<AuthData>,
}

pub async fn initiate() -> Result<InitiateResult, String> {
    let client = reqwest::Client::new();
    let resp = client.post(format!("{ATHION_URL}/api/auth/ide/initiate"))
        .send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("initiate failed: {}", resp.status()));
    }
    let body: InitiateResponse = resp.json().await.map_err(|e| e.to_string())?;
    let url = format!("{ATHION_URL}/auth/ide-login?code={}&app=opendock", body.code);
    let _ = open::that(&url);
    Ok(InitiateResult { code: body.code, url })
}

pub async fn poll(code: &str) -> Result<PollResult, String> {
    let client = reqwest::Client::new();
    let resp = client.post(format!("{ATHION_URL}/api/auth/ide/poll"))
        .json(&serde_json::json!({ "code": code }))
        .send().await.map_err(|e| e.to_string())?;
    if resp.status().as_u16() == 410 {
        return Ok(PollResult { status: "expired".into(), data: None });
    }
    let body: PollResponse = resp.json().await.map_err(|e| e.to_string())?;
    if body.status != "complete" {
        return Ok(PollResult { status: body.status, data: None });
    }
    let token = body.token.ok_or("no token in complete response")?;
    let me = fetch_me(&client, &token).await?;
    Ok(PollResult {
        status: "complete".into(),
        data: Some(AuthData {
            token: Some(token),
            user_id: Some(me.id),
            email: Some(me.email),
            display_name: me.display_name,
        }),
    })
}

pub async fn fetch_me(client: &reqwest::Client, token: &str) -> Result<MeResponse, String> {
    let resp = client.get(format!("{API_URL}/me"))
        .bearer_auth(token)
        .send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("me failed: {}", resp.status()));
    }
    resp.json().await.map_err(|e| e.to_string())
}
