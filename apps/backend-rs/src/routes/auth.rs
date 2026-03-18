use axum::middleware::from_fn;
use axum::Router;

use crate::app::AppState;
use crate::handlers;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/csrf", axum::routing::get(handlers::auth::csrf_token))
        .route("/session", axum::routing::get(handlers::auth::session))
        .route(
            "/register",
            axum::routing::post(handlers::auth::register)
                .layer(from_fn(crate::middleware::csrf::require_csrf)),
        )
        .route(
            "/login",
            axum::routing::post(handlers::auth::login)
                .layer(from_fn(crate::middleware::csrf::require_csrf)),
        )
        .route(
            "/logout",
            axum::routing::post(handlers::auth::logout)
                .layer(from_fn(crate::middleware::csrf::require_csrf)),
        )
}
