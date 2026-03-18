use axum::Router;

use crate::app::AppState;
use crate::handlers;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/health", axum::routing::get(handlers::system::health))
}
