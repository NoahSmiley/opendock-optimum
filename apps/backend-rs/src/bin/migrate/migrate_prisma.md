# migrate_prisma.rs

Migrates data from the Express backend's Prisma SQLite database.

## Source

`apps/backend/src/dal/sql/prisma/dev.db` — opened read-only.

## Tables read → written

- `User` → `users` (id, email, password hash, display name, role)
- `Note` → `notes` (title, content, folder, tags, pinned/archived flags)
- `Folder` → `note_folders` (name, color, icon, parent hierarchy)
- `Collection` → `collections` (name, description, color, icon)
- `CollectionNote` → `collection_notes` (collection↔note links)

Password hashes are copied as-is. The Rust backend uses argon2 for new passwords but can verify existing bcrypt hashes if needed.
