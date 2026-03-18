use axum::extract::{Request, State};
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::CookieJar;
use axum_extra::extract::cookie::Cookie;
use serde_json::{json, Value};

use crate::app::AppState;
use crate::error::AppError;
use crate::extractors::validated_json::ValidatedJson;
use crate::middleware::auth::{AuthUser, SESSION_COOKIE};
use crate::middleware::csrf::CSRF_COOKIE;
use crate::services;

fn ensure_csrf(jar: &CookieJar) -> String {
    jar.get(CSRF_COOKIE)
        .map(|c| c.value().to_string())
        .unwrap_or_else(|| hex::encode(rand::random::<[u8; 16]>()))
}

fn csrf_cookie(token: &str) -> Cookie<'static> {
    Cookie::build((CSRF_COOKIE, token.to_string()))
        .http_only(false)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .path("/")
        .build()
}

pub async fn csrf_token(jar: CookieJar) -> (CookieJar, Json<Value>) {
    let token = ensure_csrf(&jar);
    (jar.add(csrf_cookie(&token)), Json(json!({ "csrfToken": token })))
}

pub async fn session(jar: CookieJar, req: Request) -> (CookieJar, Json<Value>) {
    let token = ensure_csrf(&jar);
    let auth = req.extensions().get::<AuthUser>().cloned();
    let user = auth.map(|a| json!(a.0));
    (jar.add(csrf_cookie(&token)), Json(json!({ "user": user, "csrfToken": token })))
}

pub async fn register(
    State(state): State<AppState>,
    jar: CookieJar,
    ValidatedJson(body): ValidatedJson<crate::dto::auth::RegisterReq>,
) -> Result<(StatusCode, CookieJar, Json<Value>), AppError> {
    let (user, token) = services::auth::register(
        &state.db,
        &body.email,
        &body.password,
        body.display_name.as_deref(),
    )
    .await?;
    let csrf = hex::encode(rand::random::<[u8; 16]>());
    let expires = chrono::Utc::now() + chrono::Duration::days(30);
    let session_cookie = Cookie::build((SESSION_COOKIE, token))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .path("/")
        .expires(time::OffsetDateTime::from_unix_timestamp(expires.timestamp()).unwrap())
        .build();
    let csrf_cookie = Cookie::build((CSRF_COOKIE, csrf.clone()))
        .http_only(false)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .path("/")
        .build();
    let jar = jar.add(session_cookie).add(csrf_cookie);
    Ok((StatusCode::CREATED, jar, Json(json!({ "user": user, "csrfToken": csrf }))))
}

pub async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    ValidatedJson(body): ValidatedJson<crate::dto::auth::LoginReq>,
) -> Result<(CookieJar, Json<Value>), AppError> {
    let (user, token) = services::auth::login(&state.db, &body.email, &body.password).await?;
    let csrf = hex::encode(rand::random::<[u8; 16]>());
    let expires = chrono::Utc::now() + chrono::Duration::days(30);
    let session_cookie = Cookie::build((SESSION_COOKIE, token))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .path("/")
        .expires(time::OffsetDateTime::from_unix_timestamp(expires.timestamp()).unwrap())
        .build();
    let csrf_cookie = Cookie::build((CSRF_COOKIE, csrf.clone()))
        .http_only(false)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .path("/")
        .build();
    let jar = jar.add(session_cookie).add(csrf_cookie);
    Ok((jar, Json(json!({ "user": user, "csrfToken": csrf }))))
}

pub async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
    _auth: AuthUser,
) -> Result<(StatusCode, CookieJar), AppError> {
    if let Some(cookie) = jar.get(SESSION_COOKIE) {
        services::auth::logout(&state.db, cookie.value()).await?;
    }
    let jar = jar
        .remove(Cookie::build(SESSION_COOKIE).path("/").build())
        .remove(Cookie::build(CSRF_COOKIE).path("/").build());
    Ok((StatusCode::NO_CONTENT, jar))
}
