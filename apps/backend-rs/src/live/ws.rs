use super::events::Room;
use super::membership::can_access_room;
use crate::auth::verify::verify_token;
use crate::state::AppState;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use futures_util::{SinkExt, StreamExt};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct WsQuery { token: String, scope: String, id: Uuid }

pub fn router(state: AppState) -> Router {
    Router::new().route("/ws", get(upgrade)).with_state(state)
}

async fn upgrade(ws: WebSocketUpgrade, State(s): State<AppState>, Query(q): Query<WsQuery>) -> Response {
    let Some(room) = parse_room(&q.scope, q.id) else { return axum::http::StatusCode::BAD_REQUEST.into_response(); };
    let user = match verify_token(&s, &q.token).await {
        Ok(u) => u, Err(_) => return axum::http::StatusCode::UNAUTHORIZED.into_response(),
    };
    match can_access_room(&s.pool, room, user.id).await {
        Ok(true) => ws.on_upgrade(move |socket| session(socket, s, room)),
        _ => axum::http::StatusCode::NOT_FOUND.into_response(),
    }
}

fn parse_room(scope: &str, id: Uuid) -> Option<Room> {
    match scope {
        "note" => Some(Room::Note { id }),
        "board" => Some(Room::Board { id }),
        _ => None,
    }
}

async fn session(socket: WebSocket, state: AppState, room: Room) {
    let (mut tx, mut rx) = socket.split();
    let mut sub = state.hub.subscribe(room);
    loop {
        tokio::select! {
            msg = rx.next() => match msg {
                Some(Ok(Message::Close(_))) | None => break,
                _ => {}
            },
            evt = sub.recv() => match evt {
                Ok(event) => {
                    let payload = serde_json::to_string(&event).unwrap_or_default();
                    if tx.send(Message::Text(payload.into())).await.is_err() { break; }
                }
                Err(_) => continue,
            }
        }
    }
}
