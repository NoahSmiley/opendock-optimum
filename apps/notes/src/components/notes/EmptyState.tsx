import { FileText } from 'lucide-react';

interface EmptyStateProps {
  onCreateNote?: () => void;
}

export function EmptyState({ onCreateNote }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <div>
        <FileText className="mx-auto mb-4 h-16 w-16 text-neutral-300 dark:text-neutral-700" />
        <h3 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-white">
          No note selected
        </h3>
        <p className="mb-4 text-neutral-500 dark:text-neutral-400">
          Create or select a note to get started
        </p>
        {onCreateNote && (
          <button
            onClick={onCreateNote}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Create Note
          </button>
        )}
      </div>
    </div>
  );
}
