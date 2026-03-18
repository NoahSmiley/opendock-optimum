import { useState } from "react";
import { X } from "lucide-react";

interface CreateBoardModalProps {
  onSubmit: (name: string, description?: string) => Promise<void>;
  onClose: () => void;
}

export function CreateBoardModal({ onSubmit, onClose }: CreateBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      onClose();
    } catch (err) {
      console.error("Failed to create board:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-lg bg-neutral-900 p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Create Board</h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-400">Board Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="e.g. Sprint Planning" autoFocus
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase text-neutral-400">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..." rows={3}
                className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 resize-none" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose}
              className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800">Cancel</button>
            <button onClick={handleSubmit} disabled={!name.trim() || isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Creating..." : "Create Board"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
