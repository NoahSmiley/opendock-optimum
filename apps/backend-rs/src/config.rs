use std::env;

/// Application configuration loaded from environment variables.
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub uploads_dir: String,
    pub allowed_origins: Vec<String>,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite:data/opendock.db?mode=rwc".into()),
            port: env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(4001),
            uploads_dir: env::var("UPLOADS_DIR")
                .unwrap_or_else(|_| "uploads".into()),
            allowed_origins: env::var("ALLOWED_ORIGINS")
                .unwrap_or_else(|_| {
                    "http://localhost:5173,http://localhost:5174".into()
                })
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
        }
    }
}
