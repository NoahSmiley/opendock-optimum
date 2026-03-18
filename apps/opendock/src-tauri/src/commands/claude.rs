use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

use crate::claude::cli::run_claude;

pub struct ClaudeState {
    pub session_id: Arc<Mutex<Option<String>>>,
    pub active_pid: AtomicU32,
}

impl ClaudeState {
    pub fn new() -> Self {
        Self {
            session_id: Arc::new(Mutex::new(None)),
            active_pid: AtomicU32::new(0),
        }
    }
}

#[tauri::command]
pub async fn check_claude_status() -> Result<bool, String> {
    let output = tokio::process::Command::new("claude")
        .arg("--version")
        .output()
        .await;
    Ok(output.is_ok() && output.unwrap().status.success())
}

#[tauri::command]
pub async fn check_claude_auth() -> Result<bool, String> {
    let output = tokio::process::Command::new("claude")
        .args(["auth", "status"])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    Ok(stdout.contains("\"loggedIn\": true") || stdout.contains("loggedIn: true"))
}

#[tauri::command]
pub async fn start_claude_login() -> Result<(), String> {
    tokio::process::Command::new("claude")
        .args(["auth", "login"])
        .spawn()
        .map_err(|e| format!("Failed to start login: {e}"))?;
    Ok(())
}

#[tauri::command]
pub async fn send_claude_message(
    app_handle: tauri::AppHandle,
    state: State<'_, ClaudeState>,
    content: String,
) -> Result<(), String> {
    let session_id = state.session_id.lock().await.clone();
    let session_ref = Arc::clone(&state.session_id);
    let api_base = "http://localhost:4001".to_string();

    // Spawn as background task so the command returns immediately
    tokio::spawn(async move {
        match run_claude(app_handle, content, session_id, api_base).await {
            Ok(new_sid) => {
                if let Some(sid) = new_sid {
                    *session_ref.lock().await = Some(sid);
                }
            }
            Err(_) => {}
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn cancel_claude_message(
    state: State<'_, ClaudeState>,
) -> Result<(), String> {
    let pid = state.active_pid.load(Ordering::Relaxed);
    if pid > 0 {
        let _ = tokio::process::Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .output()
            .await;
        state.active_pid.store(0, Ordering::Relaxed);
    }
    Ok(())
}

#[tauri::command]
pub async fn reset_claude_session(
    state: State<'_, ClaudeState>,
) -> Result<(), String> {
    *state.session_id.lock().await = None;
    Ok(())
}
