# TicketDetailSidebar

Right sidebar of the ticket detail modal. Shows editable fields for status, priority, labels, sprint, story points, and due date, plus created/updated timestamps. Contains assign and delete quick-action buttons.

## Props
- `ticket` — Ticket being viewed
- `board` — Parent board (columns for status, sprints for sprint picker)
- `members` — Board members (passed to AssignMenu)
- `labels` — Available labels (passed to LabelMenu)
- `onUpdate` — Persists partial ticket updates
- `onRequestDelete` — Opens the delete confirmation dialog

## Used by
- `TicketDetail.tsx`

## Dependencies
- `AssignMenu`
- `LabelMenu`
- `ticketHelpers.ts` (`formatRelativeDate`)
