# collection.rs

Collection model for grouping notes. Supports optional note count enrichment.

## Exports
- `CollectionRow` — database row struct
- `Collection` — API response struct with optional `note_count`
- `CollectionNoteRow` — join table row linking collections to notes
