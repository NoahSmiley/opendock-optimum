use axum::middleware::from_fn;
use axum::routing::{delete, get, patch, post};
use axum::Router;

use crate::app::AppState;
use crate::handlers;

pub fn router() -> Router<AppState> {
    let csrf = || from_fn(crate::middleware::csrf::require_csrf);

    Router::new()
        .route("/", get(handlers::files::list_files))
        .route("/upload", post(handlers::files::upload_file))
        .route("/{id}", patch(handlers::files::update_file).layer(csrf()))
        .route("/{id}", delete(handlers::files::delete_file).layer(csrf()))
        .route("/folders", get(handlers::files::list_file_folders))
        .route("/folders", post(handlers::files::create_file_folder).layer(csrf()))
        .route("/folders/{id}", delete(handlers::files::delete_file_folder).layer(csrf()))
}
