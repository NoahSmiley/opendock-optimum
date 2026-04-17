use super::events::Room;
use crate::error::ApiResult;
use sqlx::PgPool;
use uuid::Uuid;

pub async fn can_access_room(pool: &PgPool, room: Room, user_id: Uuid) -> ApiResult<bool> {
    match room {
        Room::Note { id } => is_note_member(pool, id, user_id).await,
        Room::Board { id } => {
            let row: Option<(Uuid,)> = sqlx::query_as(
                "SELECT board_id FROM board_members WHERE board_id = $1 AND user_id = $2",
            )
            .bind(id).bind(user_id).fetch_optional(pool).await?;
            Ok(row.is_some())
        }
    }
}

pub async fn is_note_member(pool: &PgPool, note_id: Uuid, user_id: Uuid) -> ApiResult<bool> {
    let row: Option<(Uuid,)> = sqlx::query_as(
        "SELECT note_id FROM note_members WHERE note_id = $1 AND user_id = $2",
    )
    .bind(note_id).bind(user_id).fetch_optional(pool).await?;
    Ok(row.is_some())
}
