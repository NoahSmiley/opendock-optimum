# migrate_kanban_extras.rs

Migrates secondary kanban entities from `state.json`. Split from `migrate_kanban.rs` to stay under the 150-line file limit.

## Tables populated

- `kanban_comments` — Ticket comments with user references
- `kanban_time_logs` — Time tracking entries with duration
- `kanban_activities` — Board activity log with metadata JSON
- `kanban_attachments` — File attachments with size and MIME type
