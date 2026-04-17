mod auth;
mod commands;

use auth::state::AuthState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(AuthState::new())
        .invoke_handler(tauri::generate_handler![
            commands::auth::auth_initiate,
            commands::auth::auth_poll,
            commands::auth::auth_status,
            commands::auth::auth_logout,
            commands::auth::auth_token,
            commands::api::api_get,
            commands::api::api_post,
            commands::api::api_patch,
            commands::api::api_delete,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
