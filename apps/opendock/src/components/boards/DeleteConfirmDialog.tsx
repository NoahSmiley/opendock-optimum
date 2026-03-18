import { AlertCircle } from "lucide-react";

interface DeleteConfirmDialogProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ title, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onCancel} />
      <div className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-lg bg-neutral-900 p-6 shadow-xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-full bg-red-950 p-2">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Delete ticket?</h3>
          </div>
          <p className="mb-6 text-sm text-neutral-400">
            This action cannot be undone. This will permanently delete the ticket &ldquo;{title}&rdquo;.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="rounded-md border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
