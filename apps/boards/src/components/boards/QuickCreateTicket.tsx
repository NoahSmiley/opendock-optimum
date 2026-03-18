import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import type { IssueType } from "@opendock/shared/types";

interface QuickCreateTicketProps {
  columnId: string;
  onCreateTicket: (title: string, issueType: IssueType) => Promise<void>;
}

export function QuickCreateTicket({ columnId: _columnId, onCreateTicket }: QuickCreateTicketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setIsCreating(true);
    try {
      await onCreateTicket(title.trim(), "task");
      setTitle("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create ticket:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        <Plus className="h-4 w-4" />
        <span>Create</span>
      </button>
    );
  }

  return (
    <div className="rounded-md border border-neutral-300 bg-white p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) {
            handleCancel();
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        disabled={isCreating}
        className="w-full rounded border-none bg-transparent px-2 py-1.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50 dark:text-white dark:placeholder:text-neutral-500"
      />
    </div>
  );
}
