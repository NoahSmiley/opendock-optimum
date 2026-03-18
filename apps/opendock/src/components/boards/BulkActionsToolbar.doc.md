# BulkActionsToolbar

Fixed bottom toolbar shown during selection mode with bulk actions for selected tickets.

## Props
- `selectedCount` — Number of currently selected tickets
- `totalCount` — Total number of tickets (determines select/deselect all label)
- `onSelectAll` — Select all tickets
- `onDeselectAll` — Deselect all tickets
- `onBulkMove` — Move selected tickets to another column
- `onBulkAssign` — Assign selected tickets to a member
- `onBulkDelete` — Delete selected tickets
- `onExitSelection` — Exit selection mode

## Used by
- `KanbanView.tsx` (or parent managing selection state)

## Dependencies
- `lucide-react` (CheckSquare, ArrowRight, UserPlus, Trash2, X)
