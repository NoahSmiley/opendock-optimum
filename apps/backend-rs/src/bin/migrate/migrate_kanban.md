# migrate_kanban.rs

Migrates kanban data from the Express backend's `state.json` file.

## Source

`apps/backend/data/state.json` — the in-memory kanban state persisted as JSON.

## Tables populated

- `kanban_users` — Board members with avatar colors
- `kanban_boards` — Boards with member ID lists
- `kanban_columns` — Columns with board references and ordering
- `kanban_tickets` — Tickets with all fields (assignees, labels, tags as JSON arrays)
- `kanban_sprints` — Sprints with status, dates, and goals
- `kanban_labels` — Labels with board references and colors

Delegates comments, time logs, activities, and attachments to `migrate_kanban_extras`.
