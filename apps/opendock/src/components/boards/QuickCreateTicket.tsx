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

  const handleCancel = () => { setTitle(""); setIsOpen(false); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCreate();
    else if (e.key === "Escape") handleCancel();
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-md py-1.5 text-[11px] text-neutral-600 transition-colors hover:text-neutral-400">
        <Plus className="h-3.5 w-3.5" />
        <span>Create</span>
      </button>
    );
  }

  return (
    <div className="rounded-md border border-white/[0.08] p-1.5">
      <input ref={inputRef} type="text" value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => { if (!title.trim()) handleCancel(); }}
        onKeyDown={handleKeyDown} placeholder="What needs to be done?"
        disabled={isCreating}
        className="w-full border-none bg-transparent px-1.5 py-1 text-[13px] text-white outline-none placeholder:text-neutral-600 disabled:opacity-50" />
    </div>
  );
}
