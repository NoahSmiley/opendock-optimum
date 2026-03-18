# TicketDetail

Slide-over panel showing full ticket details — title, description, priority, due date, labels, assignees, comments.

## Props
- `ticket` — ticket to display
- `labels` — available labels
- `members` — board members
- `onClose` — close the panel

## Features
- Delete ticket
- Add/view comments
- Shows priority badge, due date, assignees, labels

## Used by
- `BoardsPage`

## Dependencies
- `PriorityBadge`, `DueDateBadge`, `stores/boards/actions`
