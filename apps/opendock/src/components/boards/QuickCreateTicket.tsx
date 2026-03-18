import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";

interface QuickCreateTicketProps {
  onCreateTicket: (title: string) => Promise<void>;
}

export function QuickCreateTicket({ onCreateTicket }: QuickCreateTicketProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsCreating(true);
    try {
      await onCreateTicket(title.trim());
      setTitle("");
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreate();
    else if (e.key === "Escape") handleCancel();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>Create</span>
      </button>
    );
  }

  return (
    <div className="rounded-md border border-neutral-700 bg-neutral-900 p-2 shadow-sm">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => { if (!title.trim()) handleCancel(); }}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?"
        disabled={isCreating}
        className="w-full rounded border-none bg-transparent px-2 py-1.5 text-sm text-white outline-none placeholder:text-neutral-500 disabled:opacity-50"
      />
    </div>
  );
}
