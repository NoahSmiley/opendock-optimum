# ticket.rs

Ticket model with support for JSON array fields (tags, watchers, etc.).

## Exports
- `TicketRow` — database row struct (JSON fields stored as strings)
- `Ticket` — API response struct with deserialized JSON arrays
