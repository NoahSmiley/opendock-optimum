use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

#[derive(Default, Clone, Serialize, Deserialize)]
pub struct AuthData {
    pub token: Option<String>,
    pub user_id: Option<String>,
    pub email: Option<String>,
    pub display_name: Option<String>,
}

pub struct AuthState {
    inner: RwLock<AuthData>,
}

impl AuthState {
    pub fn new() -> Self {
        Self { inner: RwLock::new(AuthData::default()) }
    }

    pub async fn set(&self, data: AuthData) {
        *self.inner.write().await = data;
    }

    pub async fn clear(&self) {
        *self.inner.write().await = AuthData::default();
    }

    pub async fn get(&self) -> AuthData {
        self.inner.read().await.clone()
    }
}
