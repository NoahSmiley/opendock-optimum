# main.rs

Application entry point. Loads configuration from environment variables,
establishes a database connection pool, runs SQLx migrations, and starts
the Axum HTTP server.

## Exports
- `main()` — async entry point; initializes config, DB pool, migrations, and server
