use std::env;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub athion_verify_url: String,
    pub bind_addr: String,
    /// When set, accepts dev bearer tokens of the form `dev:<uuid>` and
    /// authenticates them as that user without calling Athion. Intended for
    /// development only. A non-empty value in production will let anyone
    /// impersonate the configured user, so unset it there.
    pub dev_bypass_user: Option<Uuid>,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        let dev_bypass_user = env::var("DEV_BYPASS_USER_ID").ok()
            .filter(|s| !s.trim().is_empty())
            .and_then(|s| Uuid::parse_str(s.trim()).ok());
        Ok(Self {
            database_url: env::var("DATABASE_URL")?,
            athion_verify_url: env::var("ATHION_VERIFY_URL")?,
            bind_addr: env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            dev_bypass_user,
        })
    }
}
