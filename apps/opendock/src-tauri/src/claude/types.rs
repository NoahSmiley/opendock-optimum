use serde::{Deserialize, Serialize};

/// Events streamed from Claude CLI (--output-format stream-json)
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClaudeStreamEvent {
    Assistant {
        message: AssistantMessage,
    },
    User {
        #[allow(dead_code)]
        message: serde_json::Value,
        #[serde(default)]
        #[allow(dead_code)]
        tool_use_result: Option<serde_json::Value>,
    },
    Result {
        result: Option<String>,
        #[serde(default)]
        is_error: bool,
        #[serde(default)]
        session_id: Option<String>,
    },
}

#[derive(Debug, Deserialize)]
pub struct AssistantMessage {
    pub content: Vec<ContentBlock>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ContentBlock {
    Text { text: String },
    ToolUse { id: String, name: String, input: serde_json::Value },
    ToolResult { tool_use_id: String, content: String },
}

/// Events emitted to the frontend via Tauri event bus
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum ClaudeFrontendEvent {
    TextDelta { content: String },
    ToolUse { tool_id: String, name: String, input: serde_json::Value },
    ToolResult { tool_id: String, output: String },
    TurnComplete,
    Error { message: String },
}
