# LabelMenu

Dropdown menu for toggling label assignment on a ticket. Renders a list of available labels with checkboxes and colored dots. Closes on backdrop click.

## Props
- `labels` — All available labels to list
- `selectedIds` — Currently applied label IDs (determines checked state)
- `onToggle` — Callback to add or remove a label
- `onClose` — Callback to close the dropdown

## Used by
- `TicketDetailSidebar.tsx`
