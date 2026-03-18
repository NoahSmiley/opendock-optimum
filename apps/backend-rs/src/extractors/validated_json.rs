use axum::extract::rejection::JsonRejection;
use axum::extract::FromRequest;
use axum::http::Request;
use serde::de::DeserializeOwned;
use validator::Validate;

use crate::app::AppState;
use crate::error::AppError;

/// Extracts and validates a JSON body.
pub struct ValidatedJson<T>(pub T);

impl<T> FromRequest<AppState> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate + 'static,
{
    type Rejection = AppError;

    async fn from_request(
        req: Request<axum::body::Body>,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let json = axum::Json::<T>::from_request(req, state)
            .await
            .map_err(|e: JsonRejection| {
                AppError::bad_request("INVALID_PAYLOAD", &e.to_string())
            })?;

        json.0.validate().map_err(|e| {
            AppError::bad_request("VALIDATION_FAILED", &e.to_string())
        })?;

        Ok(Self(json.0))
    }
}
