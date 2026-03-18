# config.rs

Configuration module. Reads environment variables and exposes them as a
typed struct used throughout the application.

## Exports
- `Config` — struct with fields: `DATABASE_URL`, `PORT`, `UPLOADS_DIR`, `ALLOWED_ORIGINS`
