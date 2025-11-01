import { useState, useEffect } from "react";
import { X, Calendar, Tag, User, MessageSquare, Edit2, Save, Trash2, Activity as ActivityIcon } from "lucide-react";
import clsx from "clsx";
import type { KanbanTicket, KanbanTimeLog, KanbanUser, KanbanActivity, KanbanLabel } from "@opendock/shared/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { TimeTracker } from "./TimeTracker";
import { ActivityFeed } from "./ActivityFeed";
import { LabelSelector } from "./LabelSelector";
import { boardsApi } from "@/lib/api";

interface TicketDetailPanelProps {
  ticket: KanbanTicket;
  members: KanbanUser[];
  labels: KanbanLabel[];
  onClose: () => void;
  onUpdate: (ticketId: string, updates: Partial<KanbanTicket>) => Promise<void>;
  onDelete?: (ticketId: string) => Promise<void>;
  onAddComment: (ticketId: string, content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  sidebarCollapsed?: boolean;
}

const priorityStyles: Record<KanbanTicket["priority"], string> = {
  high: "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  medium: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  low: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
};

const formatTicketKey = (ticket: KanbanTicket) => {
  const [prefix] = ticket.id.split("-");
  return prefix ? prefix.toUpperCase() : ticket.id.slice(0, 6).toUpperCase();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function TicketDetailPanel({
  ticket,
  members,
  labels = [],
  onClose,
  onUpdate,
  onDelete,
  onAddComment,
  onDeleteComment,
  sidebarCollapsed = false,
}: TicketDetailPanelProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const [editedDescription, setEditedDescription] = useState(ticket.description || "");
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTimeLog, setActiveTimeLog] = useState<KanbanTimeLog | null>(null);
  const [timeLogs, setTimeLogs] = useState<KanbanTimeLog[]>([]);
  const [isLoadingTimer, setIsLoadingTimer] = useState(false);
  const [activities, setActivities] = useState<KanbanActivity[]>([]);
  const assigneeIds = Array.isArray(ticket.assigneeIds) ? ticket.assigneeIds : [];
  const labelIds = Array.isArray(ticket.labelIds) ? ticket.labelIds : [];
  const tags = Array.isArray(ticket.tags) ? ticket.tags : [];

  useEffect(() => {
    // Trigger slide-in animation after mount
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  }, []);

  // Load time logs and activities on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [activeResponse, logsResponse, activitiesResponse] = await Promise.all([
          boardsApi.getActiveTimer(ticket.id),
          boardsApi.listTimeLogs(ticket.id),
          boardsApi.listTicketActivities(ticket.id, 50),
        ]);
        setActiveTimeLog(activeResponse.timeLog);
        setTimeLogs(logsResponse.timeLogs);
        setActivities(activitiesResponse.activities);
      } catch (error) {
        console.error("Failed to load ticket data:", error);
      }
    };
    loadData();
  }, [ticket.id]);

  const handleClose = () => {
    setIsOpen(false);
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the animation duration
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() && editedTitle !== ticket.title) {
      setIsSaving(true);
      try {
        await onUpdate(ticket.id, { title: editedTitle.trim() });
        setIsEditingTitle(false);
      } finally {
        setIsSaving(false);
      }
    } else {
      setEditedTitle(ticket.title);
      setIsEditingTitle(false);
    }
  };

  const handleSaveDescription = async () => {
    if (editedDescription !== (ticket.description || "")) {
      setIsSaving(true);
      try {
        await onUpdate(ticket.id, { description: editedDescription.trim() || undefined });
        setIsEditingDescription(false);
      } finally {
        setIsSaving(false);
      }
    } else {
      setIsEditingDescription(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(ticket.id, newComment.trim());
      setNewComment("");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAssigneeChange = async (assigneeId: string) => {
    const newAssigneeIds = assigneeIds.includes(assigneeId)
      ? assigneeIds.filter((id) => id !== assigneeId)
      : [...assigneeIds, assigneeId];
    await onUpdate(ticket.id, { assigneeIds: newAssigneeIds });
  };

  const handleLabelChange = async (labelId: string) => {
    const newLabelIds = labelIds.includes(labelId)
      ? labelIds.filter((id) => id !== labelId)
      : [...labelIds, labelId];
    await onUpdate(ticket.id, { labelIds: newLabelIds });
  };

  const handlePriorityChange = async (priority: KanbanTicket["priority"]) => {
    await onUpdate(ticket.id, { priority });
  };

  const handleEstimateChange = async (estimate: number | null) => {
    await onUpdate(ticket.id, { estimate: estimate || undefined });
  };

  const handleTagsChange = async (tags: string[]) => {
    await onUpdate(ticket.id, { tags });
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      handleTagsChange([...tags, tag.trim()]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleDueDateChange = async (dateValue: string) => {
    // If empty, clear the due date
    if (!dateValue) {
      await onUpdate(ticket.id, { dueDate: undefined });
      return;
    }

    // Convert YYYY-MM-DD to ISO string at midnight local time
    const localDate = new Date(dateValue + 'T00:00:00');
    await onUpdate(ticket.id, { dueDate: localDate.toISOString() });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(ticket.id);
      handleClose();
    } catch (error) {
      console.error("Failed to delete ticket:", error);
      setIsDeleting(false);
    }
  };

  const handleStartTimer = async () => {
    setIsLoadingTimer(true);
    try {
      const response = await boardsApi.startTimer(ticket.id);
      setActiveTimeLog(response.timeLog);
      setTimeLogs((prev) => [response.timeLog, ...prev]);
    } catch (error) {
      console.error("Failed to start timer:", error);
    } finally {
      setIsLoadingTimer(false);
    }
  };

  const handleStopTimer = async (logId: string) => {
    setIsLoadingTimer(true);
    try {
      const response = await boardsApi.stopTimer(ticket.id, logId);
      setActiveTimeLog(null);
      setTimeLogs((prev) =>
        prev.map((log) => (log.id === logId ? response.timeLog : log))
      );
    } catch (error) {
      console.error("Failed to stop timer:", error);
    } finally {
      setIsLoadingTimer(false);
    }
  };

  const handleDeleteTimeLog = async (logId: string) => {
    try {
      await boardsApi.deleteTimeLog(logId);
      setTimeLogs((prev) => prev.filter((log) => log.id !== logId));
    } catch (error) {
      console.error("Failed to delete time log:", error);
    }
  };

  return (
    <>
      {/* Backdrop - positioned to not cover sidebar/navbar */}
      <div
        className={clsx(
          "fixed inset-y-0 right-0 left-0 z-30 bg-black/40 transition-opacity duration-200",
          sidebarCollapsed ? "lg:left-16" : "lg:left-64",
          isOpen && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div className={clsx(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-neutral-800 dark:bg-neutral-950",
        isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 p-6 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400 dark:text-neutral-500">
              {formatTicketKey(ticket)}
            </span>
            <span className={clsx("rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em]", priorityStyles[ticket.priority])}>
              {ticket.priority}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md p-2 text-neutral-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                title="Delete ticket"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-md p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                Title
              </label>
              {!isEditingTitle && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingTitle ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-lg font-semibold text-neutral-900 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTitle}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedTitle(ticket.title);
                      setIsEditingTitle(false);
                    }}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{ticket.title}</h2>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                Description
              </label>
              {!isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="rounded p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
                  placeholder="Add a description..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditedDescription(ticket.description || "");
                      setIsEditingDescription(false);
                    }}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {ticket.description || <span className="italic text-neutral-400 dark:text-neutral-500">No description</span>}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Assignees */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                <User className="mr-1 inline h-3 w-3" />
                Assignees
              </label>
              <div className="space-y-2">
                {members.map((member) => (
                  <label key={member.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(member.id)}
                      onChange={() => handleAssigneeChange(member.id)}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:ring-neutral-700"
                    />
                    <span className="text-neutral-700 dark:text-neutral-300">{member.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Labels */}
            <LabelSelector
              labels={labels}
              selectedLabelIds={labelIds}
              onToggleLabel={handleLabelChange}
            />

            {/* Priority */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                Priority
              </label>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as KanbanTicket["priority"])}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Estimate */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                Estimate (points)
              </label>
              <input
                type="number"
                min="0"
                value={ticket.estimate || ""}
                onChange={(e) => handleEstimateChange(e.target.value ? Number(e.target.value) : null)}
                placeholder="No estimate"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                <Calendar className="mr-1 inline h-3 w-3" />
                Due Date
              </label>
              <input
                type="date"
                value={ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : ""}
                onChange={(e) => handleDueDateChange(e.target.value)}
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                <Tag className="mr-1 inline h-3 w-3" />
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="min-w-[100px] rounded-md border border-dashed border-neutral-300 bg-transparent px-2 py-1 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700 dark:text-neutral-300 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>
          </div>

          {/* Time Tracking */}
          <TimeTracker
            ticket={ticket}
            members={members}
            onStartTimer={handleStartTimer}
            onStopTimer={handleStopTimer}
            onDeleteTimeLog={handleDeleteTimeLog}
            activeTimeLog={activeTimeLog}
            timeLogs={timeLogs}
            isLoading={isLoadingTimer}
          />

          {/* Timestamps */}
          <div className="flex gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Created {formatDate(ticket.createdAt)}</span>
            </div>
            {ticket.updatedAt !== ticket.createdAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Updated {formatDate(ticket.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <MessageSquare className="h-4 w-4" />
              Comments ({(ticket as any).comments?.length || 0})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder="Add a comment..."
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  {isSubmittingComment ? "Adding..." : "Add Comment"}
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {(ticket as any).comments && (ticket as any).comments.length > 0 ? (
                (ticket as any).comments.map((comment: any) => {
                  const author = members.find((m) => m.id === comment.userId);
                  return (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: author?.avatarColor || "#666" }}
                          >
                            {(author?.name || "U").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                              {author?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        {onDeleteComment && (
                          <button
                            onClick={() => onDeleteComment(comment.id)}
                            className="rounded p-1 text-neutral-400 transition hover:bg-neutral-200 hover:text-red-600 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
                        {comment.content}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-sm italic text-neutral-400 dark:text-neutral-500">
                  No comments yet
                </p>
              )}
            </div>
          </div>

          {/* Activity Section */}
          <div className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white">
              <ActivityIcon className="h-4 w-4" />
              Activity
            </h3>
            <ActivityFeed activities={activities} users={members} showFilters={false} limit={20} />
          </div>
        </div>
      </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
