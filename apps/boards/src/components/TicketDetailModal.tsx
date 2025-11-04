import { useState, useEffect, useRef } from "react";
import {
  X,
  MoreHorizontal,
  Link,
  Paperclip,
  Clock,
  Calendar,
  Flag,
  Tag,
  User,
  MessageSquare,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  AlertCircle,
  Share2,
  Copy,
  Archive,
  Eye,
  Users
} from "lucide-react";
import clsx from "clsx";
import type { KanbanTicket, KanbanBoard, KanbanUser, KanbanLabel, KanbanComment } from "@opendock/shared/types";
import { formatTicketKey } from "@/lib/ticketUtils";
import { IssueTypeIcon, IssueTypeSelector } from "./IssueTypeSelector";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketDetailModalProps {
  ticket: KanbanTicket;
  board: KanbanBoard;
  members: KanbanUser[];
  labels: KanbanLabel[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (ticketId: string, updates: Partial<KanbanTicket>) => Promise<void>;
  onDelete: (ticketId: string) => Promise<void>;
  onAddComment?: (ticketId: string, content: string) => Promise<void>;
  onDeleteComment?: (ticketId: string, commentId: string) => Promise<void>;
}

export function TicketDetailModal({
  ticket,
  board,
  members,
  labels,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddComment,
  onDeleteComment,
}: TicketDetailModalProps) {
  // Editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(ticket.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(ticket.description || "");
  const [isEditingStoryPoints, setIsEditingStoryPoints] = useState(false);
  const [editedStoryPoints, setEditedStoryPoints] = useState(ticket.storyPoints?.toString() || "");
  const [commentText, setCommentText] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLabelSelector, setShowLabelSelector] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  // Refs for auto-focus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const storyPointsInputRef = useRef<HTMLInputElement>(null);

  // Update local state when ticket changes
  useEffect(() => {
    setEditedTitle(ticket.title);
    setEditedDescription(ticket.description || "");
    setEditedStoryPoints(ticket.storyPoints?.toString() || "");
  }, [ticket]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription) descriptionTextareaRef.current?.focus();
  }, [isEditingDescription]);

  useEffect(() => {
    if (isEditingStoryPoints) storyPointsInputRef.current?.focus();
  }, [isEditingStoryPoints]);

  if (!isOpen) return null;

  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== ticket.title) {
      await onUpdate(ticket.id, { title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (editedDescription !== ticket.description) {
      await onUpdate(ticket.id, { description: editedDescription.trim() });
    }
    setIsEditingDescription(false);
  };

  const handleStoryPointsSave = async () => {
    const points = editedStoryPoints ? parseInt(editedStoryPoints) : undefined;
    if (points !== ticket.storyPoints) {
      await onUpdate(ticket.id, { storyPoints: points });
    }
    setIsEditingStoryPoints(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !onAddComment) return;
    setIsAddingComment(true);
    await onAddComment(ticket.id, commentText.trim());
    setCommentText("");
    setIsAddingComment(false);
  };

  const handleDelete = async () => {
    await onDelete(ticket.id);
    onClose();
  };

  const assignee = members.find(m => ticket.assigneeIds.includes(m.id));
  const ticketLabels = labels.filter(l => ticket.labelIds?.includes(l.id));
  const column = board.columns.find(c => c.id === ticket.columnId);
  const sprint = board.sprints.find(s => s.id === ticket.sprintId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-7xl -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-neutral-500 hover:text-blue-600 cursor-pointer dark:text-neutral-400 dark:hover:text-blue-400">
                {board.name}
              </span>
              <span className="text-neutral-400">/</span>
              <div className="flex items-center gap-2">
                <IssueTypeIcon type={ticket.issueType || "task"} size="sm" className="h-4 w-4" />
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  {formatTicketKey(ticket, board)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // TODO: Implement watch functionality
                  console.log('Watch clicked');
                }}
                className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Watch this issue"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  // TODO: Implement share functionality
                  console.log('Share clicked');
                }}
                className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Share"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const ticketUrl = `${window.location.origin}${window.location.pathname}#${formatTicketKey(ticket, board)}`;
                  navigator.clipboard.writeText(ticketUrl);
                  // TODO: Show toast notification
                  console.log('Link copied to clipboard');
                }}
                className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Copy link"
              >
                <Link className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  // TODO: Show more actions menu
                  console.log('More actions clicked');
                }}
                className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-[calc(90vh-80px)] overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {/* Title */}
              <div className="mb-6">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setEditedTitle(ticket.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    className="w-full border-0 border-b-2 border-blue-500 bg-transparent px-2 py-1 text-2xl font-semibold text-neutral-900 outline-none dark:text-white"
                  />
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="group relative cursor-text rounded px-2 py-1 -ml-2 text-2xl font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 dark:text-white dark:hover:bg-neutral-800"
                  >
                    {ticket.title}
                    <Edit2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </h1>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  Description
                </h3>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      ref={descriptionTextareaRef}
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setEditedDescription(ticket.description || "");
                          setIsEditingDescription(false);
                        }
                      }}
                      className="min-h-[120px] w-full rounded-md border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      placeholder="Add a description..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDescriptionSave}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditedDescription(ticket.description || "");
                          setIsEditingDescription(false);
                        }}
                        className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="group relative min-h-[60px] cursor-text rounded-md border border-transparent px-4 py-3 text-sm text-neutral-700 transition-all hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50"
                  >
                    {ticket.description ? (
                      <>
                        <div className="whitespace-pre-wrap">{ticket.description}</div>
                        <Edit2 className="absolute right-3 top-3 h-4 w-4 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </>
                    ) : (
                      <span className="flex items-center gap-2 text-neutral-400 dark:text-neutral-500">
                        <Edit2 className="h-4 w-4" />
                        Add a description...
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({ticket.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800"
                      >
                        <Paperclip className="h-4 w-4 text-neutral-400" />
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {attachment.originalFilename}
                        </a>
                        <span className="text-xs text-neutral-500">
                          {(attachment.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity / Comments */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  Activity
                </h3>

                {/* Comment Input */}
                <div className="mb-6">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                      U
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onFocus={() => setIsAddingComment(true)}
                        placeholder="Add a comment..."
                        className="w-full rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
                        rows={isAddingComment ? 3 : 1}
                      />
                      {isAddingComment && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={handleAddComment}
                            disabled={!commentText.trim()}
                            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setCommentText("");
                              setIsAddingComment(false);
                            }}
                            className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {ticket.comments && ticket.comments.length > 0 && (
                  <div className="space-y-4">
                    {ticket.comments.map((comment) => {
                      const author = members.find(m => m.id === comment.userId);
                      return (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-neutral-300 text-neutral-700 flex items-center justify-center text-xs font-semibold">
                            {author?.name?.slice(0, 2).toUpperCase() || "UN"}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-neutral-900 dark:text-white">
                                {author?.name || "Unknown"}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-80 border-l border-neutral-200 bg-neutral-50 px-6 py-6 dark:border-neutral-800 dark:bg-neutral-900">
              {/* Quick Actions */}
              <div className="mb-6 flex gap-2">
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowAssignMenu(!showAssignMenu)}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    <Users className="mr-1.5 inline h-4 w-4" />
                    Assign
                  </button>

                  {/* Assign Menu Dropdown */}
                  {showAssignMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowAssignMenu(false)}
                      />
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        {members.map((member) => {
                          const isAssigned = ticket.assigneeIds.includes(member.id);
                          return (
                            <button
                              key={member.id}
                              onClick={() => {
                                const newAssigneeIds = isAssigned
                                  ? ticket.assigneeIds.filter(id => id !== member.id)
                                  : [...ticket.assigneeIds, member.id];
                                onUpdate(ticket.id, { assigneeIds: newAssigneeIds });
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              <div className="flex h-4 w-4 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600">
                                {isAssigned && <Check className="h-3 w-3 text-blue-600" />}
                              </div>
                              <div
                                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: member.avatarColor || "#666" }}
                              >
                                {member.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-neutral-900 dark:text-white">{member.name}</span>
                            </button>
                          );
                        })}
                        {members.length === 0 && (
                          <div className="px-3 py-2 text-sm text-neutral-500">
                            No members available
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Status
                </label>
                <Select
                  value={ticket.columnId}
                  onValueChange={(value) => onUpdate(ticket.id, { columnId: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {board.columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Assignee
                </label>
                <Select
                  value={ticket.assigneeIds[0] || "unassigned"}
                  onValueChange={(value) => onUpdate(ticket.id, {
                    assigneeIds: value === "unassigned" ? [] : [value]
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Labels */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Labels
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowLabelSelector(!showLabelSelector)}
                    className="w-full min-h-[40px] rounded-md border border-neutral-300 bg-white px-3 py-2 text-left text-sm transition hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
                  >
                    <div className="flex flex-wrap gap-1">
                      {ticketLabels.length > 0 ? (
                        ticketLabels.map((label) => (
                          <span
                            key={label.id}
                            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newLabelIds = ticket.labelIds?.filter(id => id !== label.id) || [];
                                onUpdate(ticket.id, { labelIds: newLabelIds });
                              }}
                              className="hover:opacity-70"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-400 dark:text-neutral-500">Select labels...</span>
                      )}
                    </div>
                  </button>

                  {/* Label Dropdown */}
                  {showLabelSelector && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowLabelSelector(false)}
                      />
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        {labels.map((label) => {
                          const isSelected = ticket.labelIds?.includes(label.id) || false;
                          return (
                            <button
                              key={label.id}
                              onClick={() => {
                                const newLabelIds = isSelected
                                  ? ticket.labelIds?.filter(id => id !== label.id) || []
                                  : [...(ticket.labelIds || []), label.id];
                                onUpdate(ticket.id, { labelIds: newLabelIds });
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                              <div className="flex h-4 w-4 items-center justify-center rounded border border-neutral-300 dark:border-neutral-600">
                                {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                              </div>
                              <span
                                className="inline-block h-3 w-3 rounded"
                                style={{ backgroundColor: label.color }}
                              />
                              <span className="text-neutral-900 dark:text-white">{label.name}</span>
                            </button>
                          );
                        })}
                        {labels.length === 0 && (
                          <div className="px-3 py-2 text-sm text-neutral-500">
                            No labels available
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Priority
                </label>
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => onUpdate(ticket.id, {
                    priority: value as KanbanTicket["priority"]
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        Low
                      </span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        Medium
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                        High
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sprint */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Sprint
                </label>
                <Select
                  value={ticket.sprintId || "backlog"}
                  onValueChange={(value) => onUpdate(ticket.id, {
                    sprintId: value === "backlog" ? undefined : value
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    {board.sprints.map((sprint) => (
                      <SelectItem key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Story Points */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Story Points
                </label>
                {isEditingStoryPoints ? (
                  <input
                    ref={storyPointsInputRef}
                    type="number"
                    value={editedStoryPoints}
                    onChange={(e) => setEditedStoryPoints(e.target.value)}
                    onBlur={handleStoryPointsSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleStoryPointsSave();
                      if (e.key === "Escape") {
                        setEditedStoryPoints(ticket.storyPoints?.toString() || "");
                        setIsEditingStoryPoints(false);
                      }
                    }}
                    className="w-full rounded-md border border-blue-500 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-neutral-800 dark:text-white"
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingStoryPoints(true)}
                    className="cursor-text rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:border-neutral-600"
                  >
                    {ticket.storyPoints || "-"}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
                  Due Date
                </label>
                <input
                  type="date"
                  value={ticket.dueDate ? ticket.dueDate.split('T')[0] : ''}
                  onChange={(e) => onUpdate(ticket.id, {
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined
                  })}
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              {/* Dates */}
              <div className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                <div className="space-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <div>
                    Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                  </div>
                  <div>
                    Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-950">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Delete ticket?
                </h3>
              </div>
              <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
                This action cannot be undone. This will permanently delete the ticket
                "{ticket.title}".
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}