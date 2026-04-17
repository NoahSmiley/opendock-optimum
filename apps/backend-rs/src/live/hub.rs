use super::events::{LiveEvent, Room};
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::broadcast;

const ROOM_CAPACITY: usize = 64;

#[derive(Clone)]
pub struct Hub {
    rooms: Arc<DashMap<Room, broadcast::Sender<LiveEvent>>>,
}

impl Hub {
    pub fn new() -> Self { Self { rooms: Arc::new(DashMap::new()) } }

    pub fn subscribe(&self, room: Room) -> broadcast::Receiver<LiveEvent> {
        self.rooms
            .entry(room)
            .or_insert_with(|| broadcast::channel(ROOM_CAPACITY).0)
            .subscribe()
    }

    pub fn publish(&self, room: Room, event: LiveEvent) {
        if let Some(tx) = self.rooms.get(&room) {
            let _ = tx.send(event);
            if tx.receiver_count() == 0 { drop(tx); self.rooms.remove(&room); }
        }
    }
}

impl Default for Hub { fn default() -> Self { Self::new() } }
