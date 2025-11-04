import { Plus, FolderOpen, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import type { Collection } from '@opendock/shared/types';

interface CollectionsSectionProps {
  collections: Collection[];
  selectedCollectionId?: string | null;
  onSelectCollection: (collection: Collection) => void;
  onCreateCollection: () => void;
  onEditCollection?: (collection: Collection) => void;
  onDeleteCollection?: (collection: Collection) => void;
}

export function CollectionsSection({
  collections,
  selectedCollectionId,
  onSelectCollection,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
}: CollectionsSectionProps) {
  const sortedCollections = [...collections].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex h-8 items-center justify-between text-xs font-semibold text-neutral-400/90 dark:text-neutral-400/70">
        <span>Collections ({collections.length})</span>
        <button
          type="button"
          onClick={onCreateCollection}
          className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          title="Create Collection"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex w-full flex-col gap-0.5">
        {sortedCollections.length > 0 ? (
          sortedCollections.map((collection) => {
            const isSelected = selectedCollectionId === collection.id;
            return (
              <div key={collection.id} className="group flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectCollection(collection)}
                  className={clsx(
                    'group relative flex h-8 flex-1 items-center justify-start gap-2 overflow-visible rounded-md border border-transparent px-0 text-left text-[0.8rem] font-medium text-neutral-600 transition-colors outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 dark:text-neutral-300 dark:focus-visible:ring-neutral-700',
                    isSelected
                      ? 'text-neutral-900 dark:text-neutral-100'
                      : 'hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  <span className="relative -ml-2 inline-flex min-w-0 max-w-full flex-1 items-center overflow-hidden px-2 py-1">
                    <span
                      className={clsx(
                        'pointer-events-none absolute inset-0 rounded-full transition-colors',
                        isSelected
                          ? 'bg-neutral-100 dark:bg-neutral-800'
                          : 'bg-transparent group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800/70'
                      )}
                    />
                    <FolderOpen
                      className="relative z-10 mr-2 h-3.5 w-3.5 flex-shrink-0"
                      style={{ color: collection.color || undefined }}
                    />
                    <span className="relative z-10 truncate">{collection.name}</span>
                  </span>
                  {collection.noteCount !== undefined && collection.noteCount > 0 && (
                    <span className="relative z-10 mr-2 flex-shrink-0 text-[0.7rem] text-neutral-400 dark:text-neutral-500">
                      {collection.noteCount}
                    </span>
                  )}
                </button>
                {(onEditCollection || onDeleteCollection) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show context menu
                      console.log('Collection menu:', collection);
                    }}
                    className="opacity-0 rounded p-1 text-neutral-400 transition-all hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    title="Collection options"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-2 py-1 text-xs text-neutral-400 dark:text-neutral-500">
            No collections yet
          </div>
        )}
      </div>
    </div>
  );
}
