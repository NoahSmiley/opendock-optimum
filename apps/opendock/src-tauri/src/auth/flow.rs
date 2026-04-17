use crate::auth::state::AuthData;
use crate::auth::{API_URL, ATHION_URL};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct MeResponse {
    pub id: String,
    pub email: String,
    pub display_name: Option<String>,
}

#[derive(Deserialize)]
struct LoginUser { id: String, email: String, #[serde(rename = "displayName")] display_name: Option<String> }

#[derive(Deserialize)]
struct LoginResponse { token: String, user: LoginUser }

#[derive(Deserialize)]
struct ErrorResponse { error: String }

pub async fn login(email: &str, password: &str) -> Result<AuthData, String> {
    let client = reqwest::Client::new();
    let resp = client.post(format!("{ATHION_URL}/api/auth/login"))
        .json(&serde_json::json!({ "email": email, "password": password }))
        .send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        if let Ok(body) = resp.json::<ErrorResponse>().await {
            return Err(body.error);
        }
        return Err(format!("login failed: {status}"));
    }
    let body: LoginResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(AuthData {
        token: Some(body.token),
        user_id: Some(body.user.id),
        email: Some(body.user.email),
        display_name: body.user.display_name,
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
