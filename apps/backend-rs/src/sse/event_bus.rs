use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

use super::events::KanbanEvent;

const CHANNEL_CAPACITY: usize = 64;

/// Per-board broadcast channels for SSE.
pub struct EventBus {
    channels: Arc<RwLock<HashMap<String, broadcast::Sender<KanbanEvent>>>>,
}

impl EventBus {
    pub fn new() -> Self {
        Self {
            channels: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get or create a broadcast sender for a board.
    pub async fn sender(&self, board_id: &str) -> broadcast::Sender<KanbanEvent> {
        let read = self.channels.read().await;
        if let Some(tx) = read.get(board_id) {
            return tx.clone();
        }
        drop(read);

        let mut write = self.channels.write().await;
        write
            .entry(board_id.to_string())
            .or_insert_with(|| broadcast::channel(CHANNEL_CAPACITY).0)
            .clone()
    }

    /// Subscribe to events for a board.
    pub async fn subscribe(&self, board_id: &str) -> broadcast::Receiver<KanbanEvent> {
        self.sender(board_id).await.subscribe()
    }

    /// Broadcast an event to all subscribers for its board.
    pub async fn broadcast(&self, event: KanbanEvent) {
        let tx = self.sender(event.board_id()).await;
        let _ = tx.send(event);
    }
}
