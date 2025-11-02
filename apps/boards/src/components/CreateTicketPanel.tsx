import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import clsx from "clsx";
import type { KanbanBoard, KanbanUser, KanbanTicket } from "@opendock/shared/types";

interface CreateTicketPanelProps {
  board: KanbanBoard;
  onClose: () => void;
  onCreate: (ticketData: {
    title: string;
    description: string;
    columnId: string;
    assigneeIds: string[];
    priority: KanbanTicket["priority"];
    tags: string[];
  }) => Promise<void>;
  sidebarCollapsed?: boolean;
}

export function CreateTicketPanel({
  board,
  onClose,
  onCreate,
  sidebarCollapsed = false,
}: CreateTicketPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(board.columns[0]?.id || "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<KanbanTicket["priority"]>("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [panelWidth, setPanelWidth] = useState(672); // Default max-w-2xl is ~672px
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    // Trigger open animation after mount
    requestAnimationFrame(() => {
      setIsOpen(true);
    });
  }, []);

  useEffect(() => {
    if (board.columns[0]?.id) {
      setColumnId(board.columns[0].id);
    }
  }, [board.columns]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(672, Math.min(newWidth, window.innerWidth * 0.9)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleCreate = async () => {
    if (!title.trim() || !columnId) return;

    setIsCreating(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        columnId,
        assigneeIds,
        priority,
        tags,
      });
      handleClose();
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
        className={clsx(
          "fixed inset-y-0 right-0 left-0 z-30 transition-opacity duration-200 pointer-events-none",
          sidebarCollapsed ? "lg:left-16" : "lg:left-64",
          isOpen && !isClosing ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Panel */}
      <div
        className={clsx(
          "fixed inset-y-0 right-0 z-50 flex flex-col border-l border-neutral-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:border-neutral-800 dark:bg-dark-bg",
          isOpen && !isClosing ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: `${panelWidth}px` }}
      >
        {/* Resize Handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors"
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Create New Ticket</h2>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Add a new ticket to your board</p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ticket title..."
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white/10"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a detailed description..."
              rows={5}
              className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white/10"
            />
          </div>

          {/* Column & Priority Grid */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Column */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
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
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Priority
              </label>
              <div className="mt-2 flex gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={clsx(
                      "flex-1 rounded-lg px-3 py-2 text-xs font-bold transition",
                      priority === p
                        ? p === "high"
                          ? "bg-rose-600 text-white shadow-sm dark:bg-rose-500"
                          : p === "medium"
                            ? "bg-amber-600 text-white shadow-sm dark:bg-amber-500"
                            : "bg-emerald-600 text-white shadow-sm dark:bg-emerald-500"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Assignees
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {board.members.map((member) => (
                <label
                  key={member.id}
                  className={clsx(
                    "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 transition",
                    assigneeIds.includes(member.id)
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                      : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white dark:hover:border-neutral-700"
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
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Tags
            </label>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="rounded-full transition hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
                className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white/10"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
          <button
            onClick={handleClose}
            className="rounded-lg border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !columnId || isCreating}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
          >
            <Save className="h-4 w-4" />
            {isCreating ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </div>
    </>
  );
}
