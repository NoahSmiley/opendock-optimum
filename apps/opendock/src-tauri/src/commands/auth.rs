use crate::auth::flow::{self, InitiateResult, PollResult};
use crate::auth::keyring;
use crate::auth::state::{AuthData, AuthState};
use tauri::State;

#[tauri::command]
pub async fn auth_initiate() -> Result<InitiateResult, String> {
    flow::initiate().await
}

#[tauri::command]
pub async fn auth_poll(state: State<'_, AuthState>, code: String) -> Result<PollResult, String> {
    let result = flow::poll(&code).await?;
    if let Some(ref data) = result.data {
        if let Some(ref t) = data.token { keyring::store(t)?; }
        state.set(data.clone()).await;
    }
    Ok(result)
}

#[tauri::command]
pub async fn auth_status(state: State<'_, AuthState>) -> Result<AuthData, String> {
    let current = state.get().await;
    if current.token.is_some() { return Ok(current); }
    let Some(token) = keyring::load() else { return Ok(AuthData::default()); };
    let client = reqwest::Client::new();
    match flow::fetch_me(&client, &token).await {
        Ok(me) => {
            let data = AuthData {
                token: Some(token),
                user_id: Some(me.id),
                email: Some(me.email),
                display_name: me.display_name,
            };
            state.set(data.clone()).await;
            Ok(data)
        }
        Err(_) => { keyring::clear().ok(); Ok(AuthData::default()) }
    }
}

#[tauri::command]
pub async fn auth_logout(state: State<'_, AuthState>) -> Result<(), String> {
    keyring::clear()?;
    state.clear().await;
    Ok(())
}

#[tauri::command]
pub async fn auth_token(state: State<'_, AuthState>) -> Result<String, String> {
    state.get().await.token.ok_or_else(|| "not authenticated".to_string())
}
