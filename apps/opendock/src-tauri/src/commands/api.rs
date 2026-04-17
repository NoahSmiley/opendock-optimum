use crate::auth::state::AuthState;
use crate::auth::API_URL;
use serde_json::Value;
use tauri::State;

async fn token(state: &State<'_, AuthState>) -> Result<String, String> {
    state.get().await.token.ok_or_else(|| "not authenticated".to_string())
}

async fn send(method: reqwest::Method, token: String, path: String, body: Option<Value>) -> Result<Value, String> {
    let client = reqwest::Client::new();
    let mut req = client.request(method, format!("{API_URL}{path}")).bearer_auth(token);
    if let Some(b) = body { req = req.json(&b); }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status = resp.status();
    let text = resp.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        return Err(format!("{}: {}", status, text));
    }
    if text.is_empty() { return Ok(Value::Null); }
    serde_json::from_str(&text).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn api_get(state: State<'_, AuthState>, path: String) -> Result<Value, String> {
    send(reqwest::Method::GET, token(&state).await?, path, None).await
}

#[tauri::command]
pub async fn api_post(state: State<'_, AuthState>, path: String, body: Value) -> Result<Value, String> {
    send(reqwest::Method::POST, token(&state).await?, path, Some(body)).await
}

#[tauri::command]
pub async fn api_patch(state: State<'_, AuthState>, path: String, body: Value) -> Result<Value, String> {
    send(reqwest::Method::PATCH, token(&state).await?, path, Some(body)).await
}

#[tauri::command]
pub async fn api_delete(state: State<'_, AuthState>, path: String) -> Result<Value, String> {
    send(reqwest::Method::DELETE, token(&state).await?, path, None).await
}
