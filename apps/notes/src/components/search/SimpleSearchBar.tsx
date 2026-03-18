import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';
import type { Note } from '@opendock/shared/types';
import Fuse from 'fuse.js';

interface SearchBarProps {
  notes: Note[];
  onSearchResults: (results: Note[]) => void;
  onClearSearch: () => void;
  className?: string;
}

export function SimpleSearchBar({
  notes,
  onSearchResults,
  onClearSearch,
  className,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(notes, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'content', weight: 1 },
          { name: 'tags', weight: 1.5 },
        ],
        threshold: 0.3,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [notes]
  );

  // Perform search
  useEffect(() => {
    if (!searchQuery) {
      onClearSearch();
      return;
    }

    // Apply fuzzy search
    const fuseResults = fuse.search(searchQuery);
    const results = fuseResults.map((result) => result.item);
    onSearchResults(results);
  }, [searchQuery, notes, fuse, onSearchResults, onClearSearch]);

  const handleClear = () => {
    setSearchQuery('');
    onClearSearch();
    inputRef.current?.focus();
  };

  return (
    <div className={clsx('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search notes..."
        className="w-full rounded-md border-0 bg-neutral-100 py-2 pl-10 pr-10 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:bg-neutral-200 focus:ring-0 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:bg-neutral-700"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-400 transition-colors hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
          title="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
