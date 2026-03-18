# KanbanView

Main kanban board view using @hello-pangea/dnd DragDropContext. Renders columns as Droppable zones with SortableTicketCard children.

## Props
- `snapshot` — Full board snapshot (board, columns, tickets, labels, members)
- `onTicketClick` — Opens ticket detail
- `onDeleteColumn` — Deletes a column

## Features
- Drag-and-drop ticket reordering across columns
- Inline quick-create ticket in each column footer
- Horizontal scroll for many columns

## Used by
- `BoardsPage.tsx`

## Dependencies
- `KanbanColumn`, `SortableTicketCard`, `QuickCreateTicket`, `@hello-pangea/dnd`
