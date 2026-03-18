use crate::models::attachment::Attachment;
use crate::models::comment::Comment;
use crate::models::ticket::{Ticket, TicketRow};
use crate::models::time_log::TimeLog;

pub fn row_to_ticket(
    r: TicketRow,
    comments: Option<Vec<Comment>>,
    time_logs: Option<Vec<TimeLog>>,
    attachments: Option<Vec<Attachment>>,
) -> Ticket {
    let assignee_ids: Vec<String> = serde_json::from_str(&r.assignee_ids).unwrap_or_default();
    let tags: Vec<String> = serde_json::from_str(&r.tags).unwrap_or_default();
    let label_ids: Vec<String> = serde_json::from_str(&r.label_ids).unwrap_or_default();
    let components: Vec<String> = r
        .components
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();

    Ticket {
        id: r.id,
        key: r.key,
        board_id: r.board_id,
        column_id: r.column_id,
        title: r.title,
        description: r.description,
        issue_type: r.issue_type,
        epic_id: r.epic_id,
        assignee_ids,
        tags,
        label_ids,
        estimate: r.estimate,
        story_points: r.story_points,
        time_spent: r.time_spent,
        time_original_estimate: r.time_original_estimate,
        time_remaining: r.time_remaining,
        priority: r.priority,
        sprint_id: r.sprint_id,
        due_date: r.due_date,
        components,
        fix_version: r.fix_version,
        order: r.order,
        created_at: r.created_at,
        updated_at: r.updated_at,
        comments,
        time_logs,
        attachments,
    }
}
