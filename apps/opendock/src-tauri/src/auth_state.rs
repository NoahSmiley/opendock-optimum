use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct AuthData {
    pub token: Option<String>,
    pub email: Option<String>,
    pub display_name: Option<String>,
}

pub struct AuthState {
    inner: RwLock<AuthData>,
}

impl AuthState {
    pub fn new() -> Self {
        Self {
            inner: RwLock::new(AuthData::default()),
        }
    }

    pub async fn set_auth(&self, token: String, email: String, display_name: Option<String>) {
        let mut data = self.inner.write().await;
        data.token = Some(token);
        data.email = Some(email);
        data.display_name = display_name;
    }

    pub async fn clear(&self) {
        let mut data = self.inner.write().await;
        *data = AuthData::default();
    }

    pub async fn get(&self) -> AuthData {
        self.inner.read().await.clone()
    }

}
