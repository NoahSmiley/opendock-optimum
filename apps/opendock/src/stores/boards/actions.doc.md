# actions.ts

Board mutation actions — create, update, delete boards/columns/tickets/labels/sprints/comments.

Each action calls the API then refreshes the active board snapshot in the store.

## Functions
- `createBoard`, `createColumn`, `deleteColumn`
- `createTicket`, `updateTicket`, `deleteTicket`, `reorderTicket`
- `createLabel`, `createSprint`
- `addComment`, `deleteComment`

## Used by
- Board components (BoardHeader, TicketForm, TicketDetail, KanbanView, etc.)
