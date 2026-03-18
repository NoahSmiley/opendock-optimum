use axum::extract::{Request, State};
use axum::middleware::Next;
use axum::response::Response;
use axum_extra::extract::CookieJar;
use sha2::{Digest, Sha256};

use crate::app::AppState;
use crate::models::user::PublicUser;

pub const SESSION_COOKIE: &str = "od.sid";

/// Attached to request extensions by the auth middleware.
#[derive(Debug, Clone)]
pub struct AuthUser(pub PublicUser);

/// Middleware: reads `od.sid` cookie, validates session, attaches AuthUser.
pub async fn attach_user(
    State(state): State<AppState>,
    jar: CookieJar,
    mut req: Request,
    next: Next,
) -> Response {
    if let Some(cookie) = jar.get(SESSION_COOKIE) {
        let token = cookie.value().trim();
        if !token.is_empty() {
            let hash = hex::encode(Sha256::digest(token.as_bytes()));
            if let Ok(Some(session)) =
                crate::db::auth::find_session_with_user(&state.db, &hash).await
            {
                if session.expires_at > chrono::Utc::now().to_rfc3339() {
                    req.extensions_mut().insert(AuthUser(session.user));
                }
            }
        }
    }
    next.run(req).await
}
