use std::convert::Infallible;
use std::time::Duration;

use axum::extract::{Path, State};
use axum::response::sse::{Event, KeepAlive, Sse};
use futures::stream::Stream;
use tokio_stream::StreamExt;
use tokio_stream::wrappers::BroadcastStream;

use crate::app::AppState;
use crate::error::AppError;
use crate::middleware::auth::AuthUser;

pub async fn board_stream(
    State(state): State<AppState>,
    Path(board_id): Path<String>,
    _auth: AuthUser,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, AppError> {
    if crate::db::boards::get_board(&state.db, &board_id).await?.is_none() {
        return Err(AppError::not_found("BOARD_NOT_FOUND", "Board not found."));
    }
    let rx = state.event_bus.subscribe(&board_id).await;
    let stream = BroadcastStream::new(rx).filter_map(|result| {
        match result {
            Ok(event) => {
                let name = event.event_name().to_string();
                let data = serde_json::to_string(&event).unwrap_or_default();
                Some(Ok(Event::default().event(name).data(data)))
            }
            Err(_) => None,
        }
    });
    Ok(Sse::new(stream).keep_alive(KeepAlive::new().interval(Duration::from_secs(25))))
}
