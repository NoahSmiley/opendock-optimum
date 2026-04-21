use crate::config::Config;
use crate::live::hub::Hub;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub athion_verify_url: String,
    pub http: reqwest::Client,
    pub hub: Hub,
    pub dev_bypass_user: Option<Uuid>,
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
            hub: Hub::new(),
            dev_bypass_user: cfg.dev_bypass_user,
        })
    }
}
