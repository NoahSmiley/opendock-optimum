# tickets.rs

Database queries for tickets, including position/order updates and
max-order-per-column lookup.

## Exports
- Ticket CRUD functions (create, get, update, delete)
- Position update functions for reordering
- `max_order()` — returns the highest ticket order in a column
