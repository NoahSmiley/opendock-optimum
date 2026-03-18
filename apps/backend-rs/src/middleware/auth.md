# auth.rs

Authentication middleware. Reads the session cookie, validates it against
the database, and attaches the authenticated user to the request.

## Exports
- `attach_user()` — middleware that reads `od.sid` cookie, validates the session, and injects `AuthUser` into request extensions
