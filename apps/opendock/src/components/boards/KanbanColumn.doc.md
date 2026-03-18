# KanbanColumn

Single column in the kanban board. Contains a header with title and WIP-limit-aware count badge, a droppable zone for tickets, and an optional footer (quick create).

## Props
- `column` — Column data (title, wipLimit)
- `ticketCount` — Number of tickets in column
- `children` — SortableTicketCard elements
- `footer` — QuickCreateTicket component
- `droppableProvided` — From @hello-pangea/dnd Droppable render prop
- `isDraggingOver` — Visual feedback during drag
- `onDelete` — Deletes the column

## Used by
- `KanbanView.tsx`
