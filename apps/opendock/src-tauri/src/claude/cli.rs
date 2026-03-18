use std::process::Stdio;
use tauri::Emitter;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

use super::system_prompt::build_system_prompt;
use super::types::{ClaudeFrontendEvent, ClaudeStreamEvent, ContentBlock};

/// Spawn the Claude CLI and stream events to the frontend.
pub async fn run_claude(
    app_handle: tauri::AppHandle,
    prompt: String,
    session_id: Option<String>,
    api_base: String,
) -> Result<Option<String>, String> {
    let system_prompt = build_system_prompt(&api_base);

    let mut args = vec![
        "-p".to_string(),
        "--output-format".to_string(),
        "stream-json".to_string(),
        "--verbose".to_string(),
        "--dangerously-skip-permissions".to_string(),
        "--system-prompt".to_string(),
        system_prompt,
    ];

    if let Some(ref sid) = session_id {
        args.push("--resume".to_string());
        args.push(sid.clone());
    }

    args.push(prompt);

    let mut child = Command::new("claude")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .env_remove("CLAUDECODE")
        .env("DISABLE_AUTOUPDATER", "1")
        .spawn()
        .map_err(|e| format!("Failed to spawn claude: {e}"))?;

    let stdout = child.stdout.take().ok_or("No stdout")?;
    let mut lines = BufReader::new(stdout).lines();
    let mut result_session_id: Option<String> = None;

    while let Ok(Some(line)) = lines.next_line().await {
        if line.trim().is_empty() {
            continue;
        }
        match serde_json::from_str::<ClaudeStreamEvent>(&line) {
            Ok(ClaudeStreamEvent::Assistant { message }) => {
                for block in message.content {
                    let event = match block {
                        ContentBlock::Text { text } => {
                            ClaudeFrontendEvent::TextDelta { content: text }
                        }
                        ContentBlock::ToolUse { id, name, input } => {
                            ClaudeFrontendEvent::ToolUse { tool_id: id, name, input }
                        }
                        ContentBlock::ToolResult { tool_use_id, content } => {
                            ClaudeFrontendEvent::ToolResult { tool_id: tool_use_id, output: content }
                        }
                    };
                    let _ = app_handle.emit("claude:event", &event);
                }
            }
            Ok(ClaudeStreamEvent::Result { session_id: sid, is_error, result }) => {
                if is_error {
                    let msg = result.unwrap_or_else(|| "Unknown error".into());
                    let _ = app_handle.emit("claude:event", &ClaudeFrontendEvent::Error { message: msg });
                }
                result_session_id = sid;
            }
            Ok(ClaudeStreamEvent::User { .. }) => {}
            Err(_) => {}
        }
    }

    let _ = child.wait().await;
    let _ = app_handle.emit("claude:event", &ClaudeFrontendEvent::TurnComplete);

    Ok(result_session_id)
}
