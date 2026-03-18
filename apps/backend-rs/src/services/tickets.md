# tickets.rs

Ticket service. Converts raw database rows into API-ready ticket structs.

## Exports
- `row_to_ticket()` — converts a `TicketRow` to `Ticket`, deserializing JSON fields (tags, watchers, etc.)
