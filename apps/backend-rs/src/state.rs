use crate::config::Config;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub athion_verify_url: String,
    pub http: reqwest::Client,
}

impl AppState {
    pub async fn new(cfg: &Config) -> anyhow::Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(&cfg.database_url)
            .await?;
        Ok(Self {
            pool,
            athion_verify_url: cfg.athion_verify_url.clone(),
            http: reqwest::Client::new(),
        })
    }
}
