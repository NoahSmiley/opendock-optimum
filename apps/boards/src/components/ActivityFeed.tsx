import { useState, useMemo } from "react";
import {
  Activity,
  Plus,
  Edit,
  Trash2,
  Move,
  UserPlus,
  MessageSquare,
  Columns,
  Calendar,
  Filter,
  Paperclip,
} from "lucide-react";
import clsx from "clsx";
import type { KanbanActivity, KanbanUser, KanbanActivityType } from "@opendock/shared/types";

interface ActivityFeedProps {
  activities: KanbanActivity[];
  users: KanbanUser[];
  showFilters?: boolean;
  limit?: number;
  className?: string;
}

const activityIcons: Record<KanbanActivityType, typeof Activity> = {
  ticket_created: Plus,
  ticket_updated: Edit,
  ticket_deleted: Trash2,
  ticket_moved: Move,
  ticket_assigned: UserPlus,
  comment_added: MessageSquare,
  comment_deleted: Trash2,
  column_created: Columns,
  column_updated: Edit,
  column_deleted: Trash2,
  sprint_created: Calendar,
  sprint_updated: Edit,
  board_updated: Edit,
  attachment_added: Paperclip,
  attachment_deleted: Trash2,
};

const activityColors: Record<KanbanActivityType, string> = {
  ticket_created: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950",
  ticket_updated: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950",
  ticket_deleted: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950",
  ticket_moved: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950",
  ticket_assigned: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950",
  comment_added: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950",
  comment_deleted: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950",
  column_created: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950",
  column_updated: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950",
  column_deleted: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950",
  sprint_created: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950",
  sprint_updated: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950",
  board_updated: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950",
  attachment_added: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950",
  attachment_deleted: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950",
};

const formatActivityMessage = (activity: KanbanActivity, user: KanbanUser | undefined): string => {
  const userName = user?.name || "Unknown user";
  const metadata = activity.metadata || {};

  switch (activity.type) {
    case "ticket_created":
      return `${userName} created ticket "${metadata.title || "Untitled"}"`;
    case "ticket_updated":
      if (metadata.changes) {
        const changes = metadata.changes as Record<string, unknown>;
        const fields = Object.keys(changes).join(", ");
        return `${userName} updated ${fields}`;
      }
      return `${userName} updated a ticket`;
    case "ticket_deleted":
      return `${userName} deleted ticket "${metadata.title || "Untitled"}"`;
    case "ticket_moved":
      return `${userName} moved ticket to ${metadata.toColumn || "another column"}`;
    case "ticket_assigned":
      if (metadata.assignedTo) {
        return `${userName} assigned ticket to ${metadata.assignedTo}`;
      }
      return `${userName} updated ticket assignment`;
    case "comment_added":
      return `${userName} added a comment`;
    case "comment_deleted":
      return `${userName} deleted a comment`;
    case "column_created":
      return `${userName} created column "${metadata.title || "Untitled"}"`;
    case "column_updated":
      return `${userName} updated column "${metadata.title || "a column"}"`;
    case "column_deleted":
      return `${userName} deleted column "${metadata.title || "a column"}"`;
    case "sprint_created":
      return `${userName} created sprint "${metadata.name || "Untitled"}"`;
    case "sprint_updated":
      return `${userName} updated sprint "${metadata.name || "a sprint"}"`;
    case "board_updated":
      return `${userName} updated board settings`;
    case "attachment_added":
      return `${userName} added attachment "${metadata.filename || "a file"}"`;
    case "attachment_deleted":
      return `${userName} deleted attachment "${metadata.filename || "a file"}"`;
    default:
      return `${userName} performed an action`;
  }
};

const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function ActivityFeed({
  activities,
  users,
  showFilters = true,
  limit,
  className,
}: ActivityFeedProps) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<KanbanActivityType | "all">("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");

  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter((activity) => activity.type === selectedTypeFilter);
    }

    if (selectedUserFilter !== "all") {
      filtered = filtered.filter((activity) => activity.userId === selectedUserFilter);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [activities, selectedTypeFilter, selectedUserFilter, limit]);

  const activityTypes: Array<{ value: KanbanActivityType | "all"; label: string }> = [
    { value: "all", label: "All activities" },
    { value: "ticket_created", label: "Ticket created" },
    { value: "ticket_updated", label: "Ticket updated" },
    { value: "ticket_moved", label: "Ticket moved" },
    { value: "comment_added", label: "Comment added" },
    { value: "column_created", label: "Column created" },
    { value: "sprint_created", label: "Sprint created" },
  ];

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-neutral-500" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as KanbanActivityType | "all")}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
          >
            {activityTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
          >
            <option value="all">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No activity to display
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const user = users.find((u) => u.id === activity.userId);
            const Icon = activityIcons[activity.type];
            const colorClass = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3 transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
              >
                {/* Icon */}
                <div className={clsx("flex h-8 w-8 items-center justify-center rounded-full", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm text-neutral-900 dark:text-white">
                    {formatActivityMessage(activity, user)}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                    {activity.ticketId && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {activity.ticketId.split("-")[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {user && (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: user.avatarColor }}
                    title={user.name}
                  >
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
