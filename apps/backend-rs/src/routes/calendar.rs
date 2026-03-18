use axum::middleware::from_fn;
use axum::routing::{delete, get, patch, post};
use axum::Router;

use crate::app::AppState;
use crate::handlers;

pub fn router() -> Router<AppState> {
    let csrf = || from_fn(crate::middleware::csrf::require_csrf);

    Router::new()
        .route("/events", get(handlers::calendar::list_events))
        .route("/events", post(handlers::calendar::create_event).layer(csrf()))
        .route("/events/{id}", get(handlers::calendar::get_event))
        .route("/events/{id}", patch(handlers::calendar::update_event).layer(csrf()))
        .route("/events/{id}", delete(handlers::calendar::delete_event).layer(csrf()))
}
