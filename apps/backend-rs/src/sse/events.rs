use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
#[allow(dead_code)]
pub enum KanbanEvent {
    #[serde(rename_all = "camelCase")]
    BoardSnapshot { board_id: String },
    #[serde(rename_all = "camelCase")]
    TicketCreated { board_id: String, ticket_id: String },
    #[serde(rename_all = "camelCase")]
    TicketUpdated { board_id: String, ticket_id: String },
    #[serde(rename_all = "camelCase")]
    TicketDeleted { board_id: String, ticket_id: String },
    #[serde(rename_all = "camelCase")]
    TicketReordered { board_id: String },
    #[serde(rename_all = "camelCase")]
    ColumnCreated { board_id: String, column_id: String },
    #[serde(rename_all = "camelCase")]
    ColumnUpdated { board_id: String, column_id: String },
    #[serde(rename_all = "camelCase")]
    ColumnDeleted { board_id: String, column_id: String },
    #[serde(rename_all = "camelCase")]
    SprintCreated { board_id: String, sprint_id: String },
}

impl KanbanEvent {
    pub fn board_id(&self) -> &str {
        match self {
            Self::BoardSnapshot { board_id } => board_id,
            Self::TicketCreated { board_id, .. } => board_id,
            Self::TicketUpdated { board_id, .. } => board_id,
            Self::TicketDeleted { board_id, .. } => board_id,
            Self::TicketReordered { board_id } => board_id,
            Self::ColumnCreated { board_id, .. } => board_id,
            Self::ColumnUpdated { board_id, .. } => board_id,
            Self::ColumnDeleted { board_id, .. } => board_id,
            Self::SprintCreated { board_id, .. } => board_id,
        }
    }

    pub fn event_name(&self) -> &'static str {
        match self {
            Self::BoardSnapshot { .. } => "board-snapshot",
            Self::TicketCreated { .. } => "ticket-created",
            Self::TicketUpdated { .. } => "ticket-updated",
            Self::TicketDeleted { .. } => "ticket-deleted",
            Self::TicketReordered { .. } => "ticket-reordered",
            Self::ColumnCreated { .. } => "column-created",
            Self::ColumnUpdated { .. } => "column-updated",
            Self::ColumnDeleted { .. } => "column-deleted",
            Self::SprintCreated { .. } => "sprint-created",
        }
    }
}
