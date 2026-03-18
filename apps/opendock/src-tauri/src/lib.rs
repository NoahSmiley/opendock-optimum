mod auth_state;
mod claude;
mod commands;

use auth_state::AuthState;
use commands::claude::ClaudeState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(AuthState::new())
        .manage(ClaudeState::new())
        .invoke_handler(tauri::generate_handler![
            commands::auth::login_initiate,
            commands::auth::login_poll,
            commands::auth::logout,
            commands::auth::get_auth_status,
            commands::claude::check_claude_status,
            commands::claude::check_claude_auth,
            commands::claude::start_claude_login,
            commands::claude::send_claude_message,
            commands::claude::cancel_claude_message,
            commands::claude::reset_claude_session,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
