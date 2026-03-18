# auth.rs

Database queries for users and sessions. Handles user CRUD, session
creation/lookup/deletion, and a joined SessionWithUser query.

## Exports
- User CRUD functions (create, find by email, find by id)
- Session CRUD functions (create, find by token, delete)
- `SessionWithUser` — joined query returning session + user data
