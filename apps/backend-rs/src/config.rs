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
        // Bypass requires BOTH env vars. A single misconfigured var doesn't
        // enable auth bypass — production just needs to not set ALLOW_DEV_BYPASS.
        let allow = env::var("ALLOW_DEV_BYPASS").ok().as_deref() == Some("1");
        let dev_bypass_user = if allow {
            env::var("DEV_BYPASS_USER_ID").ok()
                .filter(|s| !s.trim().is_empty())
                .and_then(|s| Uuid::parse_str(s.trim()).ok())
        } else { None };
        if dev_bypass_user.is_some() {
            tracing::warn!("DEV AUTH BYPASS ENABLED — accepts `dev:<uuid>` tokens. Do not use in production.");
        }
        Ok(Self {
            database_url: env::var("DATABASE_URL")?,
            athion_verify_url: env::var("ATHION_VERIFY_URL")?,
            bind_addr: env::var("BIND_ADDR").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            dev_bypass_user,
        })
    }
}
