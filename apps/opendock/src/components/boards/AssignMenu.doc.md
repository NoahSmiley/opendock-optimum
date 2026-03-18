# AssignMenu

Dropdown menu for toggling member assignment on a ticket. Renders a list of board members with checkboxes and colored avatar initials. Closes on backdrop click.

## Props
- `members` — All board members to list
- `assigneeIds` — Currently assigned member IDs (determines checked state)
- `onToggle` — Callback to add or remove a member assignment
- `onClose` — Callback to close the dropdown

## Used by
- `TicketDetailSidebar.tsx`
