# auth.ts

Auth API functions — login, register, logout, and session check.

## Functions
- `fetchSession()` — GET /api/auth/session, returns current user + CSRF token
- `login(email, password)` — POST /api/auth/login
- `register(email, password, displayName?)` — POST /api/auth/register
- `logout()` — POST /api/auth/logout

## Used by
- `stores/auth/store.ts`
