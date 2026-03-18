# notes.rs

Note service. Converts raw database rows into API-ready note structs.

## Exports
- `row_to_note()` — converts a `NoteRow` to `Note`, deserializing the tags JSON field
