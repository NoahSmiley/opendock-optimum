# app.rs

Application setup. Defines shared application state and builds the Axum
router by composing all route modules with CORS and auth middleware.

## Exports
- `AppState` — shared state struct (DB pool, config, event bus)
- `build_router()` — assembles the full Axum router with all routes and middleware
