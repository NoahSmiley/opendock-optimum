use axum::response::Json;
use axum::routing::get;
use axum::Router;
use serde_json::json;

pub fn router<S: Clone + Send + Sync + 'static>() -> Router<S> {
    Router::new().route("/health", get(health))
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok", "service": "opendock-backend" }))
}
