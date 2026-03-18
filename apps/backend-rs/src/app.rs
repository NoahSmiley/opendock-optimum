use std::sync::Arc;

use axum::middleware::from_fn_with_state;
use axum::Router;
use sqlx::SqlitePool;
use axum::http::Method;
use tower_http::cors::{AllowHeaders, CorsLayer};
use tower_http::services::ServeDir;

use crate::config::Config;
use crate::sse::EventBus;

/// Shared state available to all handlers via Axum's State extractor.
#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub config: Arc<Config>,
    pub event_bus: Arc<EventBus>,
}

/// Build the full Axum router with all middleware and routes.
pub fn build_router(state: AppState) -> Router {
    let cors = build_cors(&state.config.allowed_origins);
    let uploads_dir = state.config.uploads_dir.clone();

    Router::new()
        .nest("/api/auth", crate::routes::auth::router())
        .nest("/api/kanban", crate::routes::kanban::router())
        .nest("/api/notes", crate::routes::notes::router())
        .nest("/api/calendar", crate::routes::calendar::router())
        .nest("/api/files", crate::routes::files::router())
        .nest("/api", crate::routes::system::router())
        .nest_service("/api/uploads", ServeDir::new(&uploads_dir))
        .layer(from_fn_with_state(
            state.clone(),
            crate::middleware::auth::attach_user,
        ))
        .layer(cors)
        .with_state(state)
}

fn build_cors(origins: &[String]) -> CorsLayer {
    let origins: Vec<_> = origins
        .iter()
        .filter_map(|o| o.parse().ok())
        .collect();

    CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(AllowHeaders::list([
            "content-type".parse().unwrap(),
            "x-opendock-csrf".parse().unwrap(),
            "accept".parse().unwrap(),
        ]))
        .expose_headers(["content-type".parse().unwrap()])
        .allow_credentials(true)
}
