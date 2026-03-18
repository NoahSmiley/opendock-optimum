# user.rs

User model definitions for database rows and API responses.

## Exports
- `User` — full database row struct (includes password hash)
- `PublicUser` — sanitized API response struct (no sensitive fields)
- `KanbanUser` — row struct for the kanban_users join table
