# BoardsPage

Route page for the Boards module. Shows board list or active board kanban view.

## Views
1. **Board list** — when no board selected, shows list of boards with create button
2. **Kanban view** — when a board is selected, shows header, filters, columns, tickets

## Features
- Fetch boards on mount
- Filter tickets by priority, assignee, label, search text
- Create boards, columns, tickets, sprints
- Open ticket detail panel
- Inline ticket creation form

## Used by
- `App.tsx` at the `/boards` route

## Dependencies
- All board components, `stores/boards/store`, `stores/boards/actions`
