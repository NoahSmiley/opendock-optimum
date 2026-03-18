use axum::middleware::from_fn;
use axum::routing::{delete, get, patch, post};
use axum::Router;

use crate::app::AppState;
use crate::handlers;

pub fn router() -> Router<AppState> {
    let csrf = || from_fn(crate::middleware::csrf::require_csrf);

    Router::new()
        // Notes
        .route("/", get(handlers::notes::list_notes))
        .route("/", post(handlers::notes::create_note).layer(csrf()))
        .route("/archived", get(handlers::notes::list_archived))
        .route("/tags", get(handlers::notes::get_tags))
        .route("/{id}", get(handlers::notes::get_note))
        .route("/{id}", patch(handlers::notes::update_note).layer(csrf()))
        .route("/{id}", delete(handlers::notes::delete_note).layer(csrf()))
        .route("/{id}/collections", get(handlers::notes::get_note_collections))
        // Folders
        .route("/folders", get(handlers::folders::list_folders))
        .route("/folders", post(handlers::folders::create_folder).layer(csrf()))
        .route("/folders/{id}", patch(handlers::folders::update_folder).layer(csrf()))
        .route("/folders/{id}", delete(handlers::folders::delete_folder).layer(csrf()))
        // Collections
        .route("/collections", get(handlers::collections::list_collections))
        .route("/collections", post(handlers::collections::create_collection).layer(csrf()))
        .route("/collections/{id}", get(handlers::collections::get_collection))
        .route("/collections/{id}", patch(handlers::collections::update_collection).layer(csrf()))
        .route("/collections/{id}", delete(handlers::collections::delete_collection).layer(csrf()))
        .route("/collections/{collectionId}/notes", get(handlers::collections::get_collection_notes))
        .route("/collections/{collectionId}/notes/{noteId}", post(handlers::collections::add_note_to_collection).layer(csrf()))
        .route("/collections/{collectionId}/notes/{noteId}", delete(handlers::collections::remove_note_from_collection).layer(csrf()))
}
