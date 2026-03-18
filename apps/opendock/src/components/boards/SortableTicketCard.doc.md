# SortableTicketCard

Wraps TicketCard with @hello-pangea/dnd Draggable for kanban drag-and-drop.

## Props
- `ticket` — Ticket data
- `index` — Position within column (required by Draggable)
- `labels`, `members` — Passed through to TicketCard
- `onClick` — Opens ticket detail
- `selectionMode`, `isSelected`, `onToggleSelect` — Bulk selection support

## Used by
- `KanbanView.tsx`

## Dependencies
- `TicketCard`, `@hello-pangea/dnd`
