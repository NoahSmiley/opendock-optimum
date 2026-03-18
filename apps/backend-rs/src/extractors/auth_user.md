# auth_user.rs

Authenticated user extractor. Implements Axum's `FromRequestParts` to
pull the current user from request extensions or return 401.

## Exports
- `AuthUser` — extractor that yields the authenticated user or rejects with 401 Unauthorized
