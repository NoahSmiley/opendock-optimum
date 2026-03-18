# TicketCard

Displays a single ticket card in the kanban board. Compact design with title, metadata row (key, priority dot, label dots), and right-side indicators (due date, attachments, story points, assignee avatar).

## Props
- `ticket` — Ticket data
- `labels` — All board labels (filtered to ticket's labelIds)
- `members` — All board members (for assignee avatar)
- `onClick` — Opens ticket detail
- `selectionMode`, `isSelected`, `onToggleSelect` — Bulk selection

## Used by
- `SortableTicketCard.tsx`

## Dependencies
- `ticketHelpers.getDueDateStatus`
