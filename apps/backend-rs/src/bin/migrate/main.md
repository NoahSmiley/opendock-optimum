# migrate/main.rs

Entry point for the data migration tool. Imports existing Express backend data into the Rust backend's SQLite database.

## Usage

```bash
cargo run --bin migrate [project_root]
```

If `project_root` is omitted, defaults to `../../` relative to `CARGO_MANIFEST_DIR`.

## What it does

1. Creates/opens the target SQLite database at `apps/backend-rs/data/opendock.db`
2. Runs all pending migrations
3. Imports kanban data from `apps/backend/data/state.json`
4. Imports auth/notes data from `apps/backend/src/dal/sql/prisma/dev.db`

## Modules

- `migrate_kanban` — Kanban boards, columns, tickets, sprints, users, labels
- `migrate_kanban_extras` — Comments, time logs, activities, attachments
- `migrate_prisma` — Users, notes, folders, collections from Prisma SQLite
