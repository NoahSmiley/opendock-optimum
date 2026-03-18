# types.ts

Type definitions for the boards domain — Board, Column, Ticket, Sprint, Epic, Label, etc.

## Types
- `Board` — full board with nested columns, tickets, sprints, epics, members, labels
- `Column` — kanban column with order and optional WIP limit
- `Ticket` — ticket with priority, assignees, labels, comments, attachments
- `Sprint`, `Epic`, `Label`, `BoardMember`, `Comment`, `Attachment`
- `BoardSnapshot` — response shape from GET /api/kanban/boards/:id

## Used by
- `stores/boards/store.ts`, `stores/boards/actions.ts`, all board components
