# QuickCreateTicket

Inline ticket creation at the bottom of each kanban column. Toggles between a "Create" button and a text input.

## Props
- `onCreateTicket` — Async callback with the title string

## Behavior
- Enter creates, Escape cancels
- Closes on blur if empty
- Shows loading state during creation

## Used by
- `KanbanView.tsx` (rendered as column footer)
