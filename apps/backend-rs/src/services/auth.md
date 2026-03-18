# auth.rs

Authentication service. Handles user registration, login, and logout with
argon2 password hashing and session token management.

## Exports
- `register()` — create user with hashed password and session
- `login()` — verify credentials and create session
- `logout()` — destroy the current session
