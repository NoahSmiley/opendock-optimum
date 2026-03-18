# board.rs

Board model definitions. Provides raw DB representation, hydrated API
form, and a full snapshot that includes all related board data.

## Exports
- `BoardRow` — database row struct
- `Board` — hydrated API response struct
- `BoardSnapshot` — full board response with columns, tickets, labels, sprints, etc.
