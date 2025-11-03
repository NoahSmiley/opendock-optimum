import { useState, useEffect, useRef } from "react";
import { X, Users, Folder, Hash } from "lucide-react";
import clsx from "clsx";
import type { KanbanUser } from "@opendock/shared/types";

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    members: Array<{ id?: string; name: string }>;
    projectId?: string;
  }) => Promise<void>;
  projects?: Array<{ value: string; label: string }>;
  existingUsers?: KanbanUser[];
}

export function CreateBoardModal({
  isOpen,
  onClose,
  onCreate,
  projects = [],
  existingUsers = [],
}: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Array<{ id?: string; name: string }>>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showMemberInput, setShowMemberInput] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        members: selectedMembers,
        projectId: projectId || undefined,
      });
      // Reset form
      setName("");
      setDescription("");
      setProjectId("");
      setSelectedMembers([]);
      setNewMemberName("");
      setShowMemberInput(false);
      onClose();
    } catch (error) {
      console.error("Failed to create board:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMember = (user: KanbanUser) => {
    const isSelected = selectedMembers.some(m => m.id === user.id || m.name === user.name);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== user.id && m.name !== user.name));
    } else {
      setSelectedMembers([...selectedMembers, { id: user.id, name: user.name }]);
    }
  };

  const addNewMember = () => {
    if (newMemberName.trim() && !selectedMembers.some(m => m.name === newMemberName.trim())) {
      setSelectedMembers([...selectedMembers, { name: newMemberName.trim() }]);
      setNewMemberName("");
      setShowMemberInput(false);
    }
  };

  const removeMember = (member: { id?: string; name: string }) => {
    setSelectedMembers(selectedMembers.filter(m =>
      m.id ? m.id !== member.id : m.name !== member.name
    ));
  };

  // Generate default columns for new boards
  const defaultColumns = ["To Do", "In Progress", "Review", "Done"];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-neutral-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Create New Board</h2>
              <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                Set up a new kanban board for your team
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
              {/* Board Name */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <Hash className="h-3.5 w-3.5" />
                  Board Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleCreate();
                  }}
                  placeholder="e.g., Sprint Board, Development Tasks"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this board's purpose..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                />
              </div>

              {/* Project Link */}
              {projects.length > 0 && (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <Folder className="h-3.5 w-3.5" />
                    Link to Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                  >
                    <option value="">No project link</option>
                    {projects.map((project) => (
                      <option key={project.value} value={project.value}>
                        {project.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Team Members */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  <Users className="h-3.5 w-3.5" />
                  Team Members
                </label>

                {/* Existing Users */}
                {existingUsers.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">Select from existing users:</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {existingUsers.map((user) => {
                        const isSelected = selectedMembers.some(m => m.id === user.id || m.name === user.name);
                        return (
                          <label
                            key={user.id}
                            className={clsx(
                              "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition",
                              isSelected
                                ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100"
                                : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:border-neutral-600"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMember(user)}
                              className="h-4 w-4 rounded border-neutral-300"
                            />
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium">{user.name}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add New Member */}
                <div className="space-y-2">
                  {!showMemberInput ? (
                    <button
                      type="button"
                      onClick={() => setShowMemberInput(true)}
                      className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-400 hover:text-neutral-700 dark:border-neutral-600 dark:text-neutral-400 dark:hover:border-neutral-500 dark:hover:text-neutral-300"
                    >
                      <Users className="h-4 w-4" />
                      Add New Member
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addNewMember();
                          }
                          if (e.key === "Escape") {
                            setNewMemberName("");
                            setShowMemberInput(false);
                          }
                        }}
                        placeholder="Enter member name..."
                        autoFocus
                        className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20"
                      />
                      <button
                        type="button"
                        onClick={addNewMember}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewMemberName("");
                          setShowMemberInput(false);
                        }}
                        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Selected Members */}
                {selectedMembers.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">Selected members:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map((member) => (
                        <span
                          key={member.id || member.name}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-[10px] font-semibold text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                            {member.name.slice(0, 2).toUpperCase()}
                          </span>
                          {member.name}
                          <button
                            type="button"
                            onClick={() => removeMember(member)}
                            className="hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Default Columns Preview */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Default Columns
                </label>
                <div className="flex gap-2">
                  {defaultColumns.map((column) => (
                    <div
                      key={column}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      {column}
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  You can customize columns after creating the board
                </p>
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
                disabled={!name.trim() || isCreating}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {isCreating ? "Creating..." : "Create Board"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}