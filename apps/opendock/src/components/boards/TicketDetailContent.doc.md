# TicketDetailContent

Left pane of the ticket detail modal. Contains an inline-editable title, inline-editable description, attachments list, and a comments/activity section with an add-comment form.

## Props
- `ticket` — Ticket to display and edit
- `members` — Board members (used to resolve comment authors)
- `onUpdate` — Persists partial ticket updates (title, description)

## Used by
- `TicketDetail.tsx`

## Dependencies
- `ticketHelpers.ts` (`formatRelativeDate`)
- `stores/boards/actions` (`addComment`)
