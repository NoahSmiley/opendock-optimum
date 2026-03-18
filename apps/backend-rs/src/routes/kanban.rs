use axum::middleware::from_fn;
use axum::routing::{delete, get, patch, post};
use axum::Router;

use crate::app::AppState;
use crate::handlers;

pub fn router() -> Router<AppState> {
    let csrf = || from_fn(crate::middleware::csrf::require_csrf);

    Router::new()
        // Boards
        .route("/boards", get(handlers::boards::list_boards))
        .route("/boards", post(handlers::boards::create_board).layer(csrf()))
        .route("/boards/{boardId}", get(handlers::boards::get_board))
        .route("/boards/{boardId}", patch(handlers::boards::update_board).layer(csrf()))
        .route("/boards/{boardId}", delete(handlers::boards::delete_board).layer(csrf()))
        // SSE
        .route("/boards/{boardId}/stream", get(handlers::sse::board_stream))
        // Columns
        .route("/boards/{boardId}/columns", post(handlers::columns::create_column).layer(csrf()))
        .route("/boards/{boardId}/columns/{columnId}", patch(handlers::columns::update_column).layer(csrf()))
        .route("/boards/{boardId}/columns/{columnId}", delete(handlers::columns::delete_column).layer(csrf()))
        // Sprints
        .route("/boards/{boardId}/sprints", post(handlers::columns::create_sprint).layer(csrf()))
        // Tickets
        .route("/boards/{boardId}/tickets", post(handlers::tickets::create_ticket).layer(csrf()))
        .route("/boards/{boardId}/tickets/reorder", patch(handlers::tickets::reorder_ticket).layer(csrf()))
        .route("/tickets/{ticketId}", patch(handlers::tickets::update_ticket).layer(csrf()))
        .route("/tickets/{ticketId}", delete(handlers::tickets::delete_ticket).layer(csrf()))
        // Comments
        .route("/tickets/{ticketId}/comments", post(handlers::tickets::add_comment).layer(csrf()))
        .route("/comments/{commentId}", delete(handlers::tickets::delete_comment).layer(csrf()))
        // Time Logs
        .route("/tickets/{ticketId}/time-logs/start", post(handlers::time_logs::start_time_log).layer(csrf()))
        .route("/tickets/{ticketId}/time-logs/{logId}/stop", post(handlers::time_logs::stop_time_log).layer(csrf()))
        .route("/tickets/{ticketId}/time-logs/active", get(handlers::time_logs::get_active))
        .route("/tickets/{ticketId}/time-logs", get(handlers::time_logs::list_time_logs))
        .route("/time-logs/{logId}", delete(handlers::time_logs::delete_time_log).layer(csrf()))
        // Labels
        .route("/boards/{boardId}/labels", get(handlers::labels::list_labels))
        .route("/boards/{boardId}/labels", post(handlers::labels::create_label).layer(csrf()))
        .route("/labels/{labelId}", patch(handlers::labels::update_label).layer(csrf()))
        .route("/labels/{labelId}", delete(handlers::labels::delete_label).layer(csrf()))
        // Activity
        .route("/boards/{boardId}/activity", get(handlers::labels::board_activity))
        .route("/tickets/{ticketId}/activity", get(handlers::labels::ticket_activity))
        // Attachments
        .route("/tickets/{ticketId}/attachments", post(handlers::attachments::upload_attachments))
        .route("/tickets/{ticketId}/attachments", get(handlers::attachments::list_attachments))
        .route("/attachments/{attachmentId}", delete(handlers::attachments::delete_attachment).layer(csrf()))
}
