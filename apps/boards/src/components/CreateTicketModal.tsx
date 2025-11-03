import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard, KanbanTicket, IssueType } from "@opendock/shared/types";
import { IssueTypeSelector } from "./IssueTypeSelector";

interface CreateTicketModalProps {
  board: KanbanBoard;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (ticketData: {
    title: string;
    description: string;
    issueType: IssueType;
    columnId: string;
    assigneeIds: string[];
    priority: KanbanTicket["priority"];
    tags: string[];
    storyPoints?: number;
  }) => Promise<void>;
}

export function CreateTicketModal({
  board,
  isOpen,
  onClose,
  onCreate,
}: CreateTicketModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<IssueType>("task");
  const [columnId, setColumnId] = useState(board.columns[0]?.id || "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<KanbanTicket["priority"]>("medium");
  const [storyPoints, setStoryPoints] = useState<number | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus title input when modal opens
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (board.columns[0]?.id) {
      setColumnId(board.columns[0].id);
    }
  }, [board.columns]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!title.trim() || !columnId) return;

    setIsCreating(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        issueType,
        columnId,
        assigneeIds,
        priority,
        storyPoints,
        tags,
      });
      // Reset form
      setTitle("");
      setDescription("");
      setIssueType("task");
      setColumnId(board.columns[0]?.id || "");
      setAssigneeIds([]);
      setPriority("medium");
      setStoryPoints(undefined);
      setTags([]);
      setTagInput("");
      onClose();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleAssignee = (userId: string) => {
    if (assigneeIds.includes(userId)) {
      setAssigneeIds(assigneeIds.filter(id => id !== userId));
    } else {
      setAssigneeIds([...assigneeIds, userId]);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create New Ticket</h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Add a new ticket to {board.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              {/* Issue Type */}
              <div>
                <IssueTypeSelector value={issueType} onChange={setIssueType} showLabel={true} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleCreate();
                  }}
                  placeholder="Enter ticket title..."
                  className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a detailed description..."
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              {/* Column, Priority & Story Points Grid */}
              <div className="grid gap-5 sm:grid-cols-3">
                {/* Column */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Column <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                  >
                    {board.columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Priority
                  </label>
                  <div className="mt-2 flex gap-2">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={clsx(
                          "flex-1 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
                          priority === p
                            ? p === "high"
                              ? "bg-rose-500 text-white shadow-sm dark:bg-rose-600"
                              : p === "medium"
                                ? "bg-amber-500 text-white shadow-sm dark:bg-amber-600"
                                : "bg-emerald-500 text-white shadow-sm dark:bg-emerald-600"
                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Story Points */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Story Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={storyPoints || ""}
                    onChange={(e) => setStoryPoints(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Points"
                    className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                  />
                </div>
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Assignees
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {board.members.map((member) => (
                    <label
                      key={member.id}
                      className={clsx(
                        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition",
                        assigneeIds.includes(member.id)
                          ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100"
                          : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:border-neutral-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={assigneeIds.includes(member.id)}
                        onChange={() => toggleAssignee(member.id)}
                        className="h-4 w-4 rounded border-neutral-300"
                      />
                      <span className="text-sm font-medium">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Tags
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag..."
                    className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Press <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">⌘</kbd> + <kbd className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs dark:bg-neutral-800">Enter</kbd> to create
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isCreating}
                className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || !columnId || isCreating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isCreating ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
