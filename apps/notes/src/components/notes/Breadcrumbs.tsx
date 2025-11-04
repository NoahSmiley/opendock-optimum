import { ChevronRight } from 'lucide-react';
import type { Collection } from '@opendock/shared/types';

interface BreadcrumbsProps {
  currentCollection: Collection | null;
  onNavigateToRoot: () => void;
}

export function Breadcrumbs({ currentCollection, onNavigateToRoot }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
      <button
        type="button"
        onClick={onNavigateToRoot}
        className="rounded px-1 py-0.5 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
      >
        All Notes
      </button>
      {currentCollection && (
        <>
          <ChevronRight className="h-3 w-3 text-neutral-400 dark:text-neutral-500" />
          <span className="rounded px-1 py-0.5 font-medium text-neutral-900 dark:text-white">
            {currentCollection.name}
          </span>
        </>
      )}
    </div>
  );
}
