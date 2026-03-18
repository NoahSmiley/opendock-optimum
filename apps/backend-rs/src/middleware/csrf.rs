use axum::extract::Request;
use axum::middleware::Next;
use axum::response::Response;
use axum_extra::extract::CookieJar;

use crate::error::AppError;

pub const CSRF_COOKIE: &str = "od.csrf";
pub const CSRF_HEADER: &str = "x-opendock-csrf";

/// Middleware: validates CSRF double-submit on mutating methods.
pub async fn require_csrf(
    jar: CookieJar,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    let method = req.method().clone();
    if method == "GET" || method == "HEAD" || method == "OPTIONS" {
        return Ok(next.run(req).await);
    }

    let cookie_token = jar
        .get(CSRF_COOKIE)
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let header_token = req
        .headers()
        .get(CSRF_HEADER)
        .and_then(|v| v.to_str().ok())
        .unwrap_or_default();

    if cookie_token.is_empty()
        || header_token.is_empty()
        || !constant_time_eq(cookie_token.as_bytes(), header_token.as_bytes())
    {
        return Err(AppError::forbidden(
            "CSRF_VALIDATION_FAILED",
            "Invalid CSRF token.",
        ));
    }

    Ok(next.run(req).await)
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    a.iter()
        .zip(b.iter())
        .fold(0u8, |acc, (x, y)| acc | (x ^ y))
        == 0
}
