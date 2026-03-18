# error.rs

Unified error handling. Provides a single error type that converts into
Axum HTTP responses with a consistent JSON shape.

## Exports
- `AppError` — error enum implementing `IntoResponse`; produces `{"error":{"code","message"}}` JSON
