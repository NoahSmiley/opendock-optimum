use crate::dto::entity_link::{EntityKind, EntityLink, EntityRef, LinkedEntity};
use crate::error::{ApiError, ApiResult};
use sqlx::PgPool;
use uuid::Uuid;

fn canonicalize(a: EntityRef, b: EntityRef) -> (EntityRef, EntityRef) {
    if (kind_str(a.kind), a.id) < (kind_str(b.kind), b.id) { (a, b) } else { (b, a) }
}

fn kind_str(k: EntityKind) -> &'static str {
    match k { EntityKind::Card => "card", EntityKind::Note => "note" }
}

pub async fn attach(pool: &PgPool, a: EntityRef, b: EntityRef, created_by: Uuid, source: &str) -> ApiResult<EntityLink> {
    if a.kind == b.kind && a.id == b.id { return Err(ApiError::NotFound); }
    let (lo, hi) = canonicalize(a, b);
    let row = sqlx::query_as::<_, EntityLink>(
        "INSERT INTO entity_links (id, a_kind, a_id, b_kind, b_id, created_by, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (a_kind, a_id, b_kind, b_id) DO UPDATE SET created_by = entity_links.created_by
         RETURNING *",
    )
    .bind(Uuid::new_v4()).bind(lo.kind).bind(lo.id).bind(hi.kind).bind(hi.id)
    .bind(created_by).bind(source)
    .fetch_one(pool).await?;
    Ok(row)
}

pub async fn detach(pool: &PgPool, a: EntityRef, b: EntityRef) -> ApiResult<bool> {
    let (lo, hi) = canonicalize(a, b);
    let res = sqlx::query("DELETE FROM entity_links WHERE a_kind = $1 AND a_id = $2 AND b_kind = $3 AND b_id = $4")
        .bind(lo.kind).bind(lo.id).bind(hi.kind).bind(hi.id)
        .execute(pool).await?;
    Ok(res.rows_affected() > 0)
}

/// Notes linked to a card, filtered to notes the viewer can see.
pub async fn notes_for_card(pool: &PgPool, card_id: Uuid, viewer_id: Uuid) -> ApiResult<Vec<LinkedEntity>> {
    let rows: Vec<(Uuid, Uuid, String, String)> = sqlx::query_as(
        "SELECT l.id, n.id, n.title, l.source
         FROM entity_links l
         JOIN notes n ON (
           (l.a_kind = 'note' AND l.a_id = n.id AND l.b_kind = 'card' AND l.b_id = $1)
           OR (l.b_kind = 'note' AND l.b_id = n.id AND l.a_kind = 'card' AND l.a_id = $1)
         )
         JOIN note_members m ON m.note_id = n.id AND m.user_id = $2
         ORDER BY l.created_at DESC",
    )
    .bind(card_id).bind(viewer_id).fetch_all(pool).await?;
    Ok(rows.into_iter().map(|(link_id, id, title, source)| LinkedEntity {
        link_id, kind: EntityKind::Note, id, title, context: None, source,
    }).collect())
}

/// Cards linked to a note, filtered to cards on boards the viewer can see.
pub async fn cards_for_note(pool: &PgPool, note_id: Uuid, viewer_id: Uuid) -> ApiResult<Vec<LinkedEntity>> {
    let rows: Vec<(Uuid, Uuid, String, String, String, String)> = sqlx::query_as(
        "SELECT l.id, c.id, c.title, b.name, col.title, l.source
         FROM entity_links l
         JOIN board_cards c ON (
           (l.a_kind = 'card' AND l.a_id = c.id AND l.b_kind = 'note' AND l.b_id = $1)
           OR (l.b_kind = 'card' AND l.b_id = c.id AND l.a_kind = 'note' AND l.a_id = $1)
         )
         JOIN boards b ON b.id = c.board_id
         JOIN board_columns col ON col.id = c.column_id
         JOIN board_members m ON m.board_id = b.id AND m.user_id = $2
         ORDER BY l.created_at DESC",
    )
    .bind(note_id).bind(viewer_id).fetch_all(pool).await?;
    Ok(rows.into_iter().map(|(link_id, id, title, board_name, col_title, source)| LinkedEntity {
        link_id, kind: EntityKind::Card, id, title,
        context: Some(format!("{} / {}", board_name, col_title)),
        source,
    }).collect())
}

pub async fn user_can_access(pool: &PgPool, r: EntityRef, user_id: Uuid) -> ApiResult<bool> {
    let ok: Option<(Uuid,)> = match r.kind {
        EntityKind::Note => sqlx::query_as("SELECT note_id FROM note_members WHERE note_id = $1 AND user_id = $2")
            .bind(r.id).bind(user_id).fetch_optional(pool).await?,
        EntityKind::Card => sqlx::query_as(
            "SELECT c.id FROM board_cards c JOIN board_members m ON m.board_id = c.board_id AND m.user_id = $2 WHERE c.id = $1",
        )
        .bind(r.id).bind(user_id).fetch_optional(pool).await?,
    };
    Ok(ok.is_some())
}

pub async fn card_board_id(pool: &PgPool, card_id: Uuid) -> ApiResult<Uuid> {
    let row: Option<(Uuid,)> = sqlx::query_as("SELECT board_id FROM board_cards WHERE id = $1")
        .bind(card_id).fetch_optional(pool).await?;
    Ok(row.ok_or(ApiError::NotFound)?.0)
}

/// Clean up any entity_links referencing a deleted entity. Call this from
/// the delete handler for notes and cards so we don't accumulate orphans.
pub async fn cascade_delete(pool: &PgPool, r: EntityRef) -> ApiResult<()> {
    sqlx::query(
        "DELETE FROM entity_links WHERE (a_kind = $1 AND a_id = $2) OR (b_kind = $1 AND b_id = $2)",
    )
    .bind(r.kind).bind(r.id).execute(pool).await?;
    Ok(())
}
