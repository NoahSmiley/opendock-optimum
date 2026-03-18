use crate::models::note::{Note, NoteRow};

pub fn row_to_note(r: NoteRow) -> Note {
    let tags: Vec<String> = serde_json::from_str(&r.tags).unwrap_or_default();
    Note {
        id: r.id,
        title: r.title,
        content: r.content,
        content_type: Some(r.content_type),
        folder_id: r.folder_id,
        tags,
        is_pinned: r.is_pinned != 0,
        is_archived: r.is_archived != 0,
        user_id: r.user_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
    }
}
