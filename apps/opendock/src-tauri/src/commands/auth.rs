use serde::{Deserialize, Serialize};
use tauri::State;

use crate::auth_state::AuthState;

const ATHION_URL: &str = "https://liminull-site.vercel.app";

#[derive(Serialize)]
pub struct LoginInitiateResult {
    pub code: String,
    pub url: String,
}

#[derive(Deserialize)]
struct InitiateResponse {
    code: String,
}

#[derive(Deserialize)]
struct PollResponse {
    status: String,
    token: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MeResponse {
    email: String,
    display_name: Option<String>,
}

#[derive(Serialize)]
pub struct PollResult {
    pub status: String,
    pub email: Option<String>,
}

#[derive(Serialize)]
pub struct AuthStatus {
    pub logged_in: bool,
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[tauri::command]
pub async fn login_initiate() -> Result<LoginInitiateResult, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{ATHION_URL}/api/auth/ide/initiate"))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("Initiate failed: {}", resp.status()));
    }

    let body: InitiateResponse = resp.json().await.map_err(|e| e.to_string())?;
    let url = format!("{ATHION_URL}/auth/ide-login?code={}&app=opendock", body.code);
    let _ = open::that(&url);

    Ok(LoginInitiateResult {
        code: body.code,
        url,
    })
}

#[tauri::command]
pub async fn login_poll(
    state: State<'_, AuthState>,
    code: String,
) -> Result<PollResult, String> {
    let client = reqwest::Client::new();
    let resp = client
        .post(format!("{ATHION_URL}/api/auth/ide/poll"))
        .json(&serde_json::json!({ "code": code }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if resp.status().as_u16() == 410 {
        return Ok(PollResult {
            status: "expired".into(),
            email: None,
        });
    }

    let body: PollResponse = resp.json().await.map_err(|e| e.to_string())?;

    if body.status == "complete" {
        let token = body
            .token
            .ok_or("No token in complete response")?;

        let me_resp = client
            .get(format!("{ATHION_URL}/api/auth/ide/me"))
            .header("Authorization", format!("Bearer {token}"))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let (email, display_name) = if me_resp.status().is_success() {
            let me: MeResponse = me_resp.json().await.unwrap_or(MeResponse {
                email: String::new(),
                display_name: None,
            });
            (me.email, me.display_name)
        } else {
            (String::new(), None)
        };

        state
            .set_auth(token, email.clone(), display_name)
            .await;

        return Ok(PollResult {
            status: "complete".into(),
            email: Some(email),
        });
    }

    Ok(PollResult {
        status: body.status,
        email: None,
    })
}

#[tauri::command]
pub async fn logout(state: State<'_, AuthState>) -> Result<(), String> {
    state.clear().await;
    Ok(())
}

#[tauri::command]
pub async fn get_auth_status(
    state: State<'_, AuthState>,
) -> Result<AuthStatus, String> {
    let auth = state.get().await;
    Ok(AuthStatus {
        logged_in: auth.token.is_some(),
        email: auth.email,
        display_name: auth.display_name,
    })
}
