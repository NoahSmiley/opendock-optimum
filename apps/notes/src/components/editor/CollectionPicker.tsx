import { FolderOpen } from 'lucide-react';
import type { Collection } from '@opendock/shared/types';

interface CollectionPickerProps {
  noteId?: string;
  noteCollections: Collection[];
  allCollections: Collection[];
  onAdd: (collectionId: string) => Promise<void>;
  onRemove: (collectionId: string) => Promise<void>;
}

export function CollectionPicker({
  noteCollections,
  allCollections,
  onAdd,
  onRemove,
}: CollectionPickerProps) {
  const currentCollection = noteCollections[0]; // Only one collection allowed

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCollectionId = e.target.value;

    // Remove from current collection if any
    if (currentCollection) {
      await onRemove(currentCollection.id);
    }

    // Add to new collection if not empty
    if (newCollectionId) {
      await onAdd(newCollectionId);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="collection-select" className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
        Notebook <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          id="collection-select"
          value={currentCollection?.id || ''}
          onChange={handleChange}
          required
          className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-10 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        >
          <option value="" disabled>Select a notebook...</option>
          {allCollections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
        {currentCollection && (
          <div className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2">
            <FolderOpen
              className="h-4 w-4"
              style={{ color: currentCollection.color || undefined }}
            />
          </div>
        )}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
