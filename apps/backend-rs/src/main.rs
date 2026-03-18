mod app;
mod config;
mod db;
mod dto;
mod error;
mod extractors;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;
mod sse;
mod uploads;

use std::sync::Arc;

use sqlx::sqlite::SqlitePoolOptions;
use tokio::net::TcpListener;

use app::{AppState, build_router};
use config::Config;
use sse::EventBus;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let config = Config::from_env();
    // Ensure data directory exists so SQLite can create the DB file
    if let Some(path) = config.database_url.strip_prefix("sqlite:") {
        let path = path.split('?').next().unwrap_or(path);
        if let Some(parent) = std::path::Path::new(path).parent() {
            std::fs::create_dir_all(parent).ok();
        }
    }
    let db = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("failed to connect to database");

    sqlx::migrate!("./migrations")
        .run(&db)
        .await
        .expect("failed to run migrations");

    std::fs::create_dir_all(&config.uploads_dir).ok();

    let port = config.port;
    let state = AppState {
        db,
        config: Arc::new(config),
        event_bus: Arc::new(EventBus::new()),
    };

    let app = build_router(state);
    let listener = TcpListener::bind(format!("0.0.0.0:{port}"))
        .await
        .expect("failed to bind port");

    tracing::info!("backend-rs listening on port {port}");
    axum::serve(listener, app).await.unwrap();
}
