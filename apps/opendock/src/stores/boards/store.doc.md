# store.ts

Boards Zustand store — manages board list, active board, selected ticket.

## State
- `boards` — list of all boards
- `activeBoard` — full snapshot of the currently viewed board
- `selectedTicket` — ticket currently open in detail view
- `loading`, `error` — async state

## Actions
- `fetchBoards()` — load board list
- `fetchBoard(id)` — load full board snapshot
- `selectTicket(ticket)` — open ticket detail
- `setActiveBoard(snapshot)` — update after mutations

## Used by
- `BoardsPage`, `BoardList`, `KanbanView`, `TicketDetail`
