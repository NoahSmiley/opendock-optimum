# BacklogTab

Flat list view of all board tickets grouped by priority (high, medium, low).

## Props
- `tickets` — Array of tickets to display
- `columns` — Board columns, used to show each ticket's current column
- `labels` — Board labels, rendered as color dots on each row
- `members` — Board members, used to resolve assignee avatars
- `onTicketClick` — Callback when a ticket row is clicked

## Used by
- `BoardsPage.tsx`

## Dependencies
- `IssueTypeIcon`, `clsx`
- `@/stores/boards/types` (Ticket, Label, BoardMember, Column)
