# TicketDetailHeader

Header bar for the ticket detail modal. Displays a breadcrumb with the board name and ticket key, plus close and copy-link action buttons.

## Props
- `ticket` — Ticket being displayed (reads `key` and `id`)
- `board` — Parent board (reads `name` for breadcrumb)
- `onClose` — Callback to close the modal

## Used by
- `TicketDetail.tsx`
