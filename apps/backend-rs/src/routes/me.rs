use crate::auth::extract::AuthUser;
use crate::error::ApiResult;
use crate::state::AppState;
use axum::extract::State;
use axum::response::Json;
use axum::routing::get;
use axum::Router;
use serde::Serialize;
use serde_json::{json, Value};
use uuid::Uuid;

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/me", get(me))
        .route("/me/cards", get(my_cards))
        .with_state(state)
}

async fn me(user: AuthUser) -> ApiResult<Json<Value>> {
    let u = user.0;
    Ok(Json(json!({
        "id": u.id,
        "email": u.email,
        "display_name": u.display_name,
        "avatar_url": u.avatar_url,
    })))
}

#[derive(Serialize, sqlx::FromRow)]
struct MyCard {
    id: Uuid,
    board_id: Uuid,
    board_name: String,
    column_title: String,
    title: String,
}

async fn my_cards(State(s): State<AppState>, user: AuthUser) -> ApiResult<Json<Vec<MyCard>>> {
    let rows = sqlx::query_as::<_, MyCard>(
        "SELECT c.id, c.board_id, b.name AS board_name, col.title AS column_title, c.title
         FROM board_cards c
         JOIN boards b ON b.id = c.board_id
         JOIN board_columns col ON col.id = c.column_id
         JOIN board_members m ON m.board_id = b.id
         WHERE m.user_id = $1
         ORDER BY b.name, col.position, c.position",
    )
    .bind(user.0.id).fetch_all(&s.pool).await?;
    Ok(Json(rows))
}
