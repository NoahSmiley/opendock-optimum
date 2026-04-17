use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub athion_verify_url: String,
    pub bind_addr: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            database_url: env::var("DATABASE_URL")?,
            athion_verify_url: env::var("ATHION_VERIFY_URL")?,
            bind_addr: env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
        })
    }
}
