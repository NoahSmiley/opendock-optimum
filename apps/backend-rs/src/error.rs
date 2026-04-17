use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("unauthorized")]
    Unauthorized,
    #[error("not found")]
    NotFound,
    #[error("database error: {0}")]
    Db(#[from] sqlx::Error),
    #[error("upstream error: {0}")]
    Upstream(#[from] reqwest::Error),
    #[error("internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, msg): (StatusCode, &'static str) = match &self {
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "unauthorized"),
            ApiError::NotFound => (StatusCode::NOT_FOUND, "not found"),
            ApiError::Db(_) => (StatusCode::INTERNAL_SERVER_ERROR, "database error"),
            ApiError::Upstream(_) => (StatusCode::BAD_GATEWAY, "upstream error"),
            ApiError::Internal(_) => (StatusCode::INTERNAL_SERVER_ERROR, "internal error"),
        };
        if status.is_server_error() { tracing::error!(error = ?self, "api error"); }
        (status, Json(json!({ "error": msg }))).into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
